# Lease Foundation + Envelope Dispatch — Design

**Date:** 2026-05-13
**Parent project:** DocuSign lease subsystem (replaces the F-001 501-stub with real lease creation).
**Decomposition:** Sub-project 1 of 3. Sub-project 2 = status tracking + webhook. Sub-project 3 (optional) = multi-party signing.

## Goal

Tenants can sign a real DocuSign lease after paying, for both the new-tenant flow (`createTenantAndLease`) and the existing-tenant flow (`loginTenantAndCreateLease`, currently F-001 501-stub). End state: a paid tenant receives an embedded DocuSign signing URL populated from a single org-wide template.

## Locked-in decisions

| Decision | Choice | Rationale |
|---|---|---|
| Lease document source | DocuSign template, ID in env var `DS_LEASE_TEMPLATE_ID` | No new file storage; legal team edits in DocuSign UI without redeploy; SDK already supports `templateId`/`templateRoles`. |
| Signing flow | Embedded (recipient view URL, iframe/redirect) | Storage rentals are short-fuse; tenant is in checkout and ready to sign. |
| Payment vs signing order | Pay → Sign | Avoids signed-but-unpaid orphans; matches existing Rental status enum. |
| Persistence | Extend `Rental` model with lease fields | 1:1 relationship; separation into a Lease model has no benefit at this stage. Migration to separate model is purely additive if sub-project 4 needs it. |
| Tenant lifecycle | Create Tenant pre-payment with `status: "pending"` | Tenant info collected upfront; failed payments leave orphans flagged for cleanup (deferred). |

## Architecture

```
Client rent form
   │
   │ POST /rental/:cid/:fid/:uid/rent           (new tenant — createTenantAndLease)
   │ POST /rental/:cid/:fid/:uid/login&rent     (existing tenant — replaces F-001 stub)
   ▼
rentalController
   │ create or look up Tenant (status: "pending")
   │ leaseService.startRental → Stripe checkout session + Rental(pending)
   ▼
returns { checkoutUrl } ──── tenant pays on Stripe ───► success_url
                                                              │
                                                              ▼
                                            POST /rental/:rentalId/lease/envelope
                                                              │
                                                              ▼
                                            leaseController.createLeaseEnvelope
                                                              │
                                                              │ assert Rental.status === "paid"
                                                              │ leaseService.createEnvelope
                                                              │   - DocuSign template + tabs
                                                              │   - persist envelopeId, signingStatus="sent"
                                                              │   - recipient view URL
                                                              ▼
                                                  returns { signingUrl }
                                                              │
                                                              ▼
                                                  client redirects to DocuSign UI
                                                              │
                                                              ▼
                                                  tenant signs (sub-project 2 webhook handles)
```

## Components

### `server/services/leaseService.js` — new

Two exported functions; both pure-ish (DB + Stripe + DocuSign at the edges, no Express dependency).

- **`startRental({ company, facility, unit, tenant, mode, successUrl, cancelUrl })` → `{ checkoutUrl, rentalId }`**
  Wraps the Stripe-checkout logic that currently lives in `paymentController.createUnitCheckoutSession`. Creates the Stripe session, creates the Rental row with `tenant: tenant._id`, `status: "pending"`, `signingStatus: "unsent"`, returns the checkout URL and rental id. Reuses the existing Stripe-readiness assertions.

- **`createEnvelope({ rentalId })` → `{ envelopeId, signingUrl }`**
  Loads Rental + populated Tenant + Unit + Facility. Asserts `Rental.status === "paid"`. If `Rental.signingStatus === "sent"` and `Rental.envelopeId` is set, reuses the envelope (idempotent re-use); otherwise creates a new envelope from `DS_LEASE_TEMPLATE_ID` with template tabs:
  - `tenantName`, `tenantEmail`, `unitNumber`, `facilityName`, `monthlyPrice`, `startDate`
  - signature tab keyed by recipient role `tenant`
  - recipient `clientUserId = tenant._id.toString()` (required for embedded signing)
  Persists `envelopeId` + `signingStatus: "sent"` on Rental. Always creates a fresh `recipientView` request (5-min URL lifetime) with `returnUrl = ${FRONTEND_URL}/rental/:rentalId/signed`.

### `server/controllers/leaseController.js` — new

- **`createLeaseEnvelope`** — handler for `POST /rental/:rentalId/lease/envelope`. Loads Rental, validates caller's authorization (API-key path uses Rental tenant match; JWT path uses session user company match), calls `leaseService.createEnvelope`, returns `{ signingUrl, envelopeId }`. 200 on happy path.

### `server/controllers/rentalController.js` — modified

- **`createTenantAndLease`** — currently creates a Tenant and returns success. New behavior:
  1. Validate input.
  2. Check duplicate-email + password validator (existing).
  3. Create Tenant with `status: "pending"`.
  4. Call `leaseService.startRental({ ..., tenant })`.
  5. Return `{ checkoutUrl }` (200).
  Failure modes: existing tenant → 400 (existing), Stripe failure → 502 + delete the Tenant created in step 3 (no orphan).

- **`loginTenantAndCreateLease`** — replaces F-001 501-stub. New behavior:
  1. Validate credentials (`tenantInfo.email` + `tenantInfo.password`); compare against existing Tenant.
  2. 401 on bad creds.
  3. Call `leaseService.startRental({ ..., tenant: existing })`.
  4. Return `{ checkoutUrl }` (200).
  Failure modes: no tenant for that email → 401 (no enumeration); wrong password → 401; Stripe failure → 502.

### `server/routes/rentalRoutes.js` — modified

Add: `router.post("/:rentalId/lease/envelope", authenticateAPIKey, leaseController.createLeaseEnvelope);`

The path has a literal `/lease/envelope` suffix so it does not collide with existing `/:companyId` or `/:companyId/:facilityId` GET routes. No reordering needed.

### `server/models/rental.js` — extended

Add fields to the existing schema:
- `tenant: { type: Schema.Types.ObjectId, ref: "Tenant" }` (optional for backwards compat with already-existing pending rentals; required for new rentals)
- `envelopeId: { type: String, index: true }`
- `signingStatus: { type: String, enum: ["unsent", "sent", "signed", "declined", "voided"], default: "unsent" }`
- `signedAt: { type: Date }`
- `signedPdfUrl: { type: String }` (populated by sub-project 2)

### `server/models/tenant.js` — extended

Add field: `status: { type: String, enum: ["pending", "active", "inactive"], default: "pending" }`. Existing tenants in DB will get `pending` on read — a one-line migration script (run-once) updates all existing tenants to `"active"`. The migration ships with this PR as `server/processes/migrations/2026-05-13-backfill-tenant-status.js`.

## New env vars

- `DS_LEASE_TEMPLATE_ID` — DocuSign template UUID. Required for envelope creation. Module-level warning at startup if unset (mirroring F-207 pattern in `docusignClient.js`).

Both `CLAUDE.md` files are updated to include the new var and to describe required template-tab labels (`tenantName`, `tenantEmail`, `unitNumber`, `facilityName`, `monthlyPrice`, `startDate`) and recipient role (`tenant`).

## Endpoints summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/rental/:cid/:fid/:uid/rent` | API key | New tenant: create Tenant + Stripe session, return checkoutUrl |
| POST | `/rental/:cid/:fid/:uid/login&rent` | API key | Existing tenant: validate creds + Stripe session, return checkoutUrl (replaces F-001 stub) |
| POST | `/rental/:rentalId/lease/envelope` | API key | Post-payment: create DocuSign envelope, return embedded signing URL |

## Error matrix

| Step | Failure | Status | Side effect |
|---|---|---|---|
| Create Tenant | duplicate email | 400 | none |
| Create Stripe session | SDK error | 502 | Tenant created in same request is deleted |
| Login validate | bad creds | 401 | none |
| Envelope endpoint | `Rental.status !== "paid"` | 409 | none |
| Envelope endpoint | `Rental.signingStatus !== "unsent"` AND envelopeId set | 200 | returns existing envelope id + fresh signing URL (idempotent) |
| Envelope endpoint | `DS_LEASE_TEMPLATE_ID` unset | 500 | startup warning already logged |
| Envelope endpoint | DocuSign create envelope fails | 502 | `signingStatus` stays `unsent`, retryable |

## Testing

New test files under `server/tests/`:

- `services/leaseService.startRental.test.js` — mocks Stripe; asserts Tenant link, Rental persists with `status: "pending"`, returns checkoutUrl.
- `services/leaseService.createEnvelope.test.js` — mocks `getEnvelopesApi`; asserts (a) 409 on unpaid Rental, (b) envelope creation payload shape (templateId, tab labels, clientUserId), (c) Rental mutated with envelopeId + `signingStatus: "sent"`, (d) idempotent re-use returns same envelopeId with fresh URL.
- `controllers/leaseController.createLeaseEnvelope.test.js` — happy path 200; 409 unpaid; 401 unauthorized caller.
- `controllers/rentalController.createTenantAndLease.test.js` — updates existing test: now expects `{ checkoutUrl }` not "Tenant and lease created"; Tenant has `status: "pending"`; duplicate-email returns 400; Stripe failure rolls back Tenant.
- `controllers/rentalController.loginTenantAndCreateLease.test.js` — **replaces the F-001 501 regression test**: 200 with checkoutUrl on valid creds; 401 on bad email; 401 on bad password.
- `processes/migrations/backfillTenantStatus.test.js` — runs migration against a seeded DB with status-less tenants; asserts all transition to `"active"`.

The existing F-001 test (`server/tests/controllers/rentalController.test.js`) that asserts 501 is rewritten to assert 200 + checkoutUrl shape.

## Sequencing within this sub-project

1. Extend Rental + Tenant models (failing test → migration script → fields)
2. `leaseService.startRental` (failing test → impl)
3. Modify `createTenantAndLease` to use service (failing test → controller change)
4. Modify `loginTenantAndCreateLease` to replace stub (failing test → controller change)
5. `leaseService.createEnvelope` (failing test → impl)
6. `leaseController.createLeaseEnvelope` + route (failing test → controller + route)
7. Update CLAUDE.md docs

Each step is one commit.

## Out of scope (sub-project 2+)

- DocuSign Connect webhook receiver
- Signed-PDF download + storage
- Tenant.status transition `pending → active` on lease signed
- Pending-tenant orphan cleanup job
- Lease decline/void user flows
- Multi-party signing
- Frontend changes (this is server-only; client integration is tracked separately)

## Risks

- **`DS_LEASE_TEMPLATE_ID` must exist before deploy.** The template is authored in DocuSign UI by the operator; the env var holds the UUID. Without it, envelope creation fails fast. Documented in CLAUDE.md with required tab labels.
- **Embedded signing URL is 5-min lifetime.** Mitigation: `createLeaseEnvelope` always generates a fresh recipient-view URL even when reusing an existing envelope. The client is expected to redirect immediately after receiving the URL.
- **Pending-tenant orphans.** A failed Stripe checkout could leave Tenant records in `pending` status. Sub-project 1 deletes a Tenant only when the same-request Stripe call fails; checkouts the tenant abandons later are out of scope and accumulate until the cleanup job (sub-project 2 follow-up) ships.
- **Stripe currency vs Rental currency drift.** The Stripe session is created with the price's currency; the Rental row stores the same. Out of scope: multi-currency reconciliation.
