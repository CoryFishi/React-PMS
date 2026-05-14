# Gate Integration (OpenTech first, pluggable for future) — Design

**Date:** 2026-05-14
**Source request:** Gate integration starting with OpenTech IoE (Insomniaccia), pluggable for future operators (Nokē/PTI/Brivo).
**Reference:** OpenTech IoE Service API Guide v1.0 (2018-05-23) — Authorization API, Access Control API, Access Event API.

## Goal

When a tenant pays + signs a lease, React-PMS provisions them as a visitor in the facility's gate-control system so their access code opens the gate. When the lease is declined/voided or the tenant goes delinquent, access is revoked or suspended. The integration is a pluggable adapter so future gate vendors slot in without rewriting orchestration.

## Locked-in decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Provision + revoke + delinquency suspend (no access-event ingestion, no admin overrides) | Coherent narrative; events polling is a clean follow-up sub-project. |
| Vendor selection | Per-Facility (`Facility.gateProvider`) | Within one Company, Facility A on OpenTech, Facility B on Nokē, Facility C none — all valid. |
| Credential storage | Per-Company in Mongo (`Company.gateProviders.opentech`); per-Facility/Unit/Rental foreign IDs in `gateProviderRefs` | OpenTech's account model = one credential set per account, multiple facilities per account. Encryption-at-rest is a flagged follow-up. |
| Client ID/Secret | Env-level (`OPENTECH_CLIENT_ID`, `OPENTECH_CLIENT_SECRET`) | Per-application, shared across all companies. |
| Access code | Server-generated random N-digit (default 8) | Collision-resistant (10^8 ≈ 100M); zero UX friction; configurable via `GATE_ACCESS_CODE_LENGTH`. |
| Sync model | Inline + idempotent + DocuSign-retried | Reuses DocuSign's retry machinery; idempotency keyed on persisted `visitorId`. |
| Time groups + access profiles | Pulled from OpenTech into Facility doc; operator picks defaults via React-PMS endpoint | Operator UX inside React-PMS; no need to context-switch to OpenTech's UI for routine ops. |

## Architecture

```
┌─ DocuSign webhook (sub-project 2) ──┐
│  applyEnvelopeEvent: signed         │
└──────────────┬──────────────────────┘
               │
               ▼
   ┌──────────────────────────┐      ┌──────────────────────────┐
   │ gateService              │      │ delinquency.js (cron)    │
   │  .provisionTenant        │      │  iterates delinquents    │
   │  .revokeTenant           │      │  → gateService.suspend   │
   │  .suspendUnit            │◄─────┤                          │
   │  .unsuspendUnit          │      │ unsuspend hook deferred  │
   │  .syncFacilityResources  │      │  (depends on payment hook)│
   └──────────────┬───────────┘      └──────────────────────────┘
                  │
                  ▼ (dispatches based on Facility.gateProvider)
   ┌──────────────────────────────┐
   │ GateProviderAdapter (interface contract via JSDoc)
   │  provisionTenant / revokeTenant
   │  suspendUnit / unsuspendUnit
   │  listTimeGroups / listAccessProfiles
   │  healthCheck
   └──────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────┐    ┌──────────────────────────┐
   │ openTechAdapter          │    │ NokeAdapter (future)     │
   │  - JWT token cache       │    └──────────────────────────┘
   │  - 401 refresh + retry   │
   │  - 5XX backoff           │
   │  - Visitor / Unit / Time │
   │    Group / Access Profile│
   │    operations            │
   └──────────────────────────┘
```

## Components

### `server/services/gateProviders/GateProviderAdapter.js` — new (contract only)

JSDoc typedef documenting the method signatures every adapter must implement. Plain JS (no TS).

```js
/**
 * @typedef {Object} GateTimeGroup
 * @property {string} id
 * @property {string} name
 * @property {boolean} isDefault
 *
 * @typedef {Object} GateAccessProfile
 * @property {string} id
 * @property {string} name
 * @property {boolean} isDefault
 *
 * @typedef {Object} GateProvisionInput
 * @property {Object} facility
 * @property {Object} rental
 * @property {Object} tenant
 * @property {string} accessCode
 *
 * @typedef {Object} GateProviderAdapter
 * @property {(input: GateProvisionInput) => Promise<{ visitorId: string }>} provisionTenant
 * @property {({facility, rental}) => Promise<void>} revokeTenant
 * @property {({facility, unit}) => Promise<void>} suspendUnit
 * @property {({facility, unit}) => Promise<void>} unsuspendUnit
 * @property {({facility}) => Promise<GateTimeGroup[]>} listTimeGroups
 * @property {({facility}) => Promise<GateAccessProfile[]>} listAccessProfiles
 * @property {({facility}) => Promise<{ ok: boolean, error?: string }>} healthCheck
 */
```

### `server/services/gateProviders/openTechAdapter.js` — new

Concrete OpenTech implementation. Single default export object matching `GateProviderAdapter`.

- **HTTP client:** `node:fetch` (Node 18+ built-in). No new dependency.
- **Base URLs** keyed by `OPENTECH_ENV` (`"prod"` default → `*.insomniaccia.com`; `"dev"` → `*.insomniaccia-dev.com`).
- **JWT cache** keyed by `companyId`. Stored in-process `Map`. Token TTL = `expires_in * 60` seconds per docs (note: docs say "number of minutes," refresh 5 min before expiry).
- **Auth:** `POST {AUTH_BASE}/auth/token` with `application/x-www-form-urlencoded` body containing `grant_type=password`, `username=<apiKey>`, `password=<apiSecret>`, `client_id=<env>`, `client_secret=<env>`. Returns `access_token`.
- **Standard headers on Access Control calls:** `Authorization: Bearer <jwt>`, `api-version: 2.0`.
- **401 handling:** invalidate cached token, re-auth, retry once.
- **5XX handling:** exponential backoff per `GATE_RETRY_BACKOFF_MS` (default `"1000,2000,4000"`). After last retry, bubble.
- **Operations:**
  - `provisionTenant`: `POST /facilities/{fid}/visitors` with `{ isTenant: true, unitId, accessCode, timeGroupId, accessProfileId, mobilePhoneNumber, firstName, lastName }`. Pulls `timeGroupId`/`accessProfileId` from `facility.gateProviderRefs.opentech.defaultTimeGroupId/defaultAccessProfileId`.
  - `revokeTenant`: `POST /facilities/{fid}/units/{uid}/vacate` (removes ALL visitors on the unit).
  - `suspendUnit`: `POST /facilities/{fid}/units/{uid}/disable`.
  - `unsuspendUnit`: `POST /facilities/{fid}/units/{uid}/enable`.
  - `listTimeGroups`: `GET /facilities/{fid}/time-groups`.
  - `listAccessProfiles`: `GET /facilities/{fid}/access-profiles`.
  - `healthCheck`: `GET /facilities` (cheap ping that also verifies auth).
- **Credentials:** the adapter accepts a `(company)` arg implicitly via the orchestrator passing `facility` whose company is populated. Adapter reads `company.gateProviders.opentech.{apiKey,apiSecret}`.

### `server/services/gateService.js` — new

Vendor-agnostic orchestration. Each public function:
1. Loads the relevant Facility (with `company` populated).
2. If `facility.gateProvider == null` → no-op (`{ noop: true, reason: "no-provider" }`).
3. Picks adapter from `adapters[facility.gateProvider]`.
4. Performs idempotency check using persisted foreign IDs.
5. Calls adapter method.
6. Persists the new foreign id (`visitorId` on Rental, etc.).
7. Writes Event row.
8. Returns `{ noop: false, ...result }`.

Exports:
- `provisionTenant({ rentalId })` — generates access code (8 random digits by default), calls adapter, persists `Rental.gateProviderRefs.opentech.{visitorId, accessCode, provisionedAt}`. Skips if `visitorId` already set. If OpenTech returns 400 "duplicate access code," regenerates once and retries.
- `revokeTenant({ rentalId })` — calls adapter `revokeTenant`. Clears `Rental.gateProviderRefs.opentech.visitorId` after success. Skips if no `visitorId`.
- `suspendUnit({ unitId })` — calls adapter `suspendUnit`. Idempotency via no persisted state (OpenTech's own state machine handles repeated disables gracefully — adapter swallows 400 "already disabled").
- `unsuspendUnit({ unitId })` — mirror of suspendUnit. **Not wired to any caller in this sub-project** (no payment-success hook exists yet); documented for future use.
- `syncFacilityResources({ facilityId })` — calls `listTimeGroups` + `listAccessProfiles`; persists arrays + `syncedAt` on `Facility.gateProviderRefs.<provider>`. Does NOT change the operator's defaults.
- `retryProvisionTenant({ rentalId })` — alias for `provisionTenant` with explicit idempotency bypass when `visitorId` is unset OR a stored `gateProvisionError` exists. Used by the manual retry endpoint.

### `server/controllers/gateController.js` — new

Thin handlers:
- `syncFacility(req, res)` → calls `gateService.syncFacilityResources`. 200 with synced counts.
- `setDefaults(req, res)` → updates `Facility.gateProviderRefs.<provider>.defaultTimeGroupId/AccessProfileId`. Validates IDs against the synced lists. 200.
- `getStatus(req, res)` → returns `{ adapterHealthy, lastSyncedAt, unprovisionedRentalCount }`. 200.
- `retryProvision(req, res)` → calls `gateService.retryProvisionTenant`. 200 or 502.

### Routing

Routes are added to existing routers (no new top-level mount). In `facilityRoutes.js`:

```js
router.post("/:facilityId/gate/sync", authenticate, gateController.syncFacility);
router.put("/:facilityId/gate/defaults", authenticate, gateController.setDefaults);
router.get("/:facilityId/gate/status", authenticate, gateController.getStatus);
```

In `rentalRoutes.js`:

```js
router.post("/:rentalId/gate/retry", authenticateAPIKey, gateController.retryProvision);
```

### Hooks into existing code

- **`server/services/leaseService.js` `applyEnvelopeEvent`** (sub-project 2): after the `signed`/`declined`/`voided` state transitions and Event audit row, call:
  - `signed` → `await gateService.provisionTenant({ rentalId: rental._id }).catch(err => { rental.gateProvisionError = err.message; await rental.save(); })`. Errors don't block envelope-signed transition; they're captured for operator retry.
  - `declined` / `voided` → `await gateService.revokeTenant({ rentalId: rental._id }).catch(...)`. Same pattern.
- **`server/processes/delinquency.js`**: for each newly-delinquent Rental's unit, call `gateService.suspendUnit({ unitId: rental.unit })`. Catch + log per-tenant (don't fail the whole batch).
- **`server/models/event.js`**: add to the eventName enum: `"Gate Provisioned"`, `"Gate Revoked"`, `"Gate Suspended"`, `"Gate Unsuspended"`, `"Gate Sync"`. eventType is `"Integration"`.
- **`server/models/rental.js`**: add `gateProvisionError: String` for operator visibility on stuck rentals.

## Schema additions

```js
// Company
Company.gateProviders = {
  opentech: {
    apiKey: String,
    apiSecret: String,    // plaintext for now; encryption-at-rest is a documented follow-up
  },
  // future: noke: {...}, pti: {...}
};

// Facility
Facility.gateProvider = {
  type: String,
  enum: ["opentech"],     // extend as adapters land
  default: undefined,     // null/undefined = no gate integration
};
Facility.gateProviderRefs = {
  opentech: {
    facilityId: String,                            // OpenTech-side facility id
    timeGroups: [{ id: String, name: String, isDefault: Boolean }],
    accessProfiles: [{ id: String, name: String, isDefault: Boolean }],
    defaultTimeGroupId: String,
    defaultAccessProfileId: String,
    syncedAt: Date,
  },
};

// StorageUnit
StorageUnit.gateProviderRefs = {
  opentech: { unitId: String },
};

// Rental
Rental.gateProviderRefs = {
  opentech: {
    visitorId: String,
    accessCode: String,         // 8-digit code stored for tenant portal / confirmation email
    provisionedAt: Date,
  },
};
Rental.gateProvisionError = String;   // surfaced in admin "unprovisioned rentals" view
```

## New env vars

- `OPENTECH_CLIENT_ID` — per-application, shared across companies
- `OPENTECH_CLIENT_SECRET` — same
- `OPENTECH_ENV` — `"prod"` (default) or `"dev"`; swaps `.insomniaccia.com` ↔ `.insomniaccia-dev.com`
- `GATE_ACCESS_CODE_LENGTH` — default `8`
- `GATE_RETRY_BACKOFF_MS` — comma-separated, default `"1000,2000,4000"`

Documented in both `CLAUDE.md` files. The setup checklist for OpenTech goes into `server/CLAUDE.md`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/facilities/:facilityId/gate/sync` | JWT (Company_Admin+) | Pull TGs + APs into Facility doc |
| PUT | `/facilities/:facilityId/gate/defaults` | JWT (Company_Admin+) | Set `defaultTimeGroupId` + `defaultAccessProfileId` |
| GET | `/facilities/:facilityId/gate/status` | JWT (Company_Admin+) | Adapter health + last sync + unprovisioned-rentals count |
| POST | `/rental/:rentalId/gate/retry` | API key | Manual recovery for a stuck rental |

## Error matrix

| Step | Failure | Status / handling |
|---|---|---|
| applyEnvelopeEvent → provisionTenant | OpenTech 5XX (after backoff) | Caught in lease handler; `rental.gateProvisionError = err.message`; envelope-signed transition completes; webhook returns 200 |
| applyEnvelopeEvent → provisionTenant | OpenTech 401 | Adapter refreshes token + retries once (transparent) |
| applyEnvelopeEvent → provisionTenant | OpenTech 400 "duplicate access code" | gateService regenerates code + retries once; if still 400, persists `gateProvisionError` |
| applyEnvelopeEvent → provisionTenant | Facility has no defaults configured | Throws `"Gate defaults not configured"`; captured as `gateProvisionError`; operator must run sync + setDefaults |
| Delinquency cron → suspendUnit | OpenTech 5XX | Log per-tenant + continue; rental retried next cron run |
| Sync endpoint | Auth fails | 502 with message `"OpenTech credentials invalid for company <id>"` |
| Sync endpoint | OpenTech facility id not set on Facility | 400 with message `"Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)"` |
| setDefaults | Specified IDs not in synced lists | 400 with message `"Time group / access profile not in synced list — run /sync first"` |
| Retry endpoint | Rental already has `visitorId` | 200 with message `"already provisioned"` (idempotent) |

## Testing

- `services/gateProviders/openTechAdapter.test.js` — mocks global `fetch`; auth happy-path, 401 refresh-and-retry, 5XX backoff sequence, `api-version: 2.0` header on every Access Control call, env switching (prod vs dev URL base), JWT cache hit on second call within TTL.
- `services/gateService.provisionTenant.test.js` — happy path persists visitorId/accessCode/provisionedAt + writes Event; no-op when `Facility.gateProvider == null`; idempotent when visitorId already set; 400 duplicate retry; missing defaults throws clear error.
- `services/gateService.revokeTenant.test.js` — adapter called, visitorId cleared, Event written.
- `services/gateService.suspendUnit.test.js` / `unsuspendUnit.test.js` — adapter called, Event written.
- `services/gateService.syncFacilityResources.test.js` — Facility populated with timeGroups + accessProfiles + syncedAt.
- `controllers/gateController.syncFacility.test.js` — 200 happy path; 401 unauth; 502 on auth fail.
- `controllers/gateController.setDefaults.test.js` — happy path; 400 on bad IDs.
- `controllers/gateController.getStatus.test.js` — returns the expected shape.
- `controllers/gateController.retryProvision.test.js` — happy path; 200 idempotent; 502 on adapter failure.
- `services/leaseService.applyEnvelopeEvent.test.js` (existing — extend): asserts `provisionTenant` called on signed, `revokeTenant` called on declined/voided, errors persist `gateProvisionError` without breaking the envelope transition.
- `processes/delinquency.test.js` (existing — extend): asserts `suspendUnit` called for newly-delinquent rentals; per-rental errors don't abort the batch.
- `unit/eventGateEnum.test.js` — 5 new Event enum values accepted.
- `unit/rentalGateFields.test.js` — `gateProviderRefs.opentech.*` and `gateProvisionError` persist.

## Sequencing within this sub-project

1. Extend Event enum (5 new values) + Rental schema (gateProviderRefs + gateProvisionError) + Facility/StorageUnit/Company schema additions
2. Adapter interface contract (JSDoc only)
3. `openTechAdapter` — auth + JWT cache
4. `openTechAdapter` — visitor/unit/sync ops (failing tests + impl per op)
5. `gateService.syncFacilityResources` + sync endpoint + setDefaults endpoint
6. `gateService.provisionTenant` + retry endpoint
7. `gateService.revokeTenant`
8. `gateService.suspendUnit` / `unsuspendUnit`
9. Hook into `applyEnvelopeEvent` (signed → provision; declined/voided → revoke)
10. Hook into `delinquency.js` (delinquent → suspend)
11. CLAUDE.md docs + env wiring in test setup

Each step is one or two commits.

## Out of scope (follow-up sub-projects)

- **Access Event API polling** — pull gate-open events from `accessevent.insomniaccia.com` and persist as Event rows. Tracked as the deferred sub-project from earlier scope decomposition.
- **Encrypted credentials at rest** — `Company.gateProviders.opentech.apiSecret` is plaintext for v1. Solve at deployment layer (MongoDB Atlas KMS, AWS KMS envelope encryption) or via a follow-up that adds `OPENTECH_CREDS_KEY` for AES-256.
- **Tenant-facing PIN reset / change** — out of scope; tenants get their PIN at provisioning time only.
- **Time-group / access-profile editing in React-PMS** — operators edit those in OpenTech's UI; we mirror read-only into our DB.
- **Multi-vendor adapters** — Nokē/PTI/Brivo implementations are separate sub-projects.
- **Unsuspend-on-payment hook** — `unsuspendUnit` exists in the service but no caller wires it (the existing payment flow doesn't emit a "delinquency cleared" event). Adding that hook is a small follow-up.
- **Admin UI for editing `Company.gateProviders.opentech` credentials** — for v1, operators update the document directly in Mongo (or via a one-off admin script). A proper admin UI is a separate frontend task.

## Risks

- **Adapter contract drift** — if OpenTech adds a required field to `POST /visitors`, the mocked tests pass but production fails. Mitigation: the `/gate/status` endpoint calls `healthCheck` (which hits a real OpenTech endpoint), so operators see auth/API regressions in their dashboard.
- **Idempotency gap on provisioning** — if OpenTech creates the visitor but React-PMS crashes before persisting `visitorId`, we have an orphan visitor. Mitigation: `provisionTenant` first checks for an existing visitor by access code on the unit (via a `GET /facilities/{fid}/visitors` filter); if found, persists the id instead of creating a duplicate.
- **OpenTech rate limits** — docs don't specify limits. Bulk provisioning during a backfill could hit a wall. Mitigation: `gateService.provisionTenant` is only called per-rental from the webhook (1 rental → 1 call); the sync endpoint hits only 2 list endpoints per facility.
- **Token cache leaks across companies** — JWT cache must be keyed by `companyId`. Wrong key = wrong company's data. Mitigation: explicit `companyId` argument in the cache `Map.get`/`set`; a test that auths two companies and asserts isolation.
- **Delinquency state for OpenTech vs React-PMS can diverge** — operator could enable a unit directly in OpenTech's UI while React-PMS still flags it delinquent. Out of scope for v1; flagged in the spec.
