# Rental `/rent` Split — Checkout Flow Fix — Design

**Date:** 2026-05-17
**Branch:** `claude/fix-rent-split` (worktree `.claude/worktrees/fix-rent-split`, off `origin/main` @ 5128a1a)
**Type:** Cross-stack bug fix (server controllers + client wizard + tests).

## Problem

The Rental Center wizard calls `createTenant()` → `POST /rental/:co/:fac/:unit/rent` as a "save tenant info" step (it shows *"Tenant created successfully"* and advances the wizard). But the server's `createTenantAndLease` for that route does three things atomically: creates the Tenant, calls `leaseService.startRental` (creates a Stripe Checkout session, **requires `successUrl`/`cancelUrl`**), returns `{ checkoutUrl, rentalId }`, and **deletes the Tenant if Stripe fails**.

The client sends only `{ tenantInfo }` — no `successUrl`/`cancelUrl` — so `startRental` throws `"successUrl and cancelUrl are required"`, the controller returns `502 "Failed to start rental payment"`, and the Tenant is rolled back. The wizard's actual payment step, `handleCheckout()`, posts to a **different** endpoint, `/payments/unit-checkout-session` (`createUnitCheckoutSession`), which has its own `successUrl/cancelUrl`.

Two competing checkout paths exist. `/rent` (and its sibling `/login&rent` / `loginTenantAndCreateLease`) does Stripe work the wizard does not want there, and returns a shape (`{checkoutUrl,rentalId}`) the client does not consume (the client does `setTenantInfo(response.data)`).

**Correctness landmine:** `createUnitCheckoutSession` builds the Rental against a `tenantShim` with a throwaway random `ObjectId` unless `req.body.tenantId` is supplied — and `handleCheckout` does not send `tenantId`. Making `/payments/unit-checkout-session` the sole checkout path *without* threading the real Tenant `_id` would bind every Rental to a phantom tenant, silently breaking downstream `applyEnvelopeEvent` (sets `rental.tenant.status = "Active"`) and gate provisioning.

## Goal

Split `/rent` and `/login&rent` so they **only resolve/create the Tenant** (no Stripe). Make `/payments/unit-checkout-session` the single canonical checkout path, correctly bound to the real Tenant via a threaded `tenantId`.

## Locked-in decisions

| Decision | Choice |
|---|---|
| Canonical checkout path | `/payments/unit-checkout-session` only. `/rent` + `/login&rent` create/resolve Tenant only. |
| Orphan (abandoned-cart) tenants | Rely on existing `orphanCleanup` (deletes `status:"New"` tenants with no paid rental after `ORPHAN_TENANT_AGE_DAYS`). No new code; documented dependency. |
| Tenant linkage | `/rent` + `/login&rent` return a tenant DTO incl. `_id`; client `handleCheckout` sends `tenantId`; `createUnitCheckoutSession` loads the real Tenant when `tenantId` present. |
| Tenant lookup in checkout | When `tenantId` present and Tenant found, use the real doc (`_id`, `firstName`, `lastName`, `contactInfo.email`) for the Stripe session + lease metadata. Shim fallback only when `tenantId` absent or not found. |
| Response DTO | `{ tenant: { _id, firstName, lastName, email, phone, status } }` — `email`/`phone` flattened from `contactInfo`. No raw Mongoose doc (avoids leaking `password`, `recoveryQuestions`, address, DL). |

## Architecture

Three units, each independently testable:

```
POST /rental/:co/:fac/:unit/rent        (createTenantAndLease)   — Tenant create only → tenant DTO
POST /rental/:co/:fac/:unit/login&rent  (loginTenantAndCreateLease) — Tenant auth only → tenant DTO
POST /payments/unit-checkout-session    (createUnitCheckoutSession) — sole Stripe path; real Tenant when tenantId
client RentalCheckout.jsx               — store tenant DTO; handleCheckout sends tenantId
```

## Components

### `createTenantAndLease` (`server/controllers/rentalController.js`)

- **Keep:** `tenantInfo` required (400), duplicate-email check (`400 "User already exists. Please Login."`), `passwordValidator`, company/facility existence (404), unit vacancy (`400 "The selected unit is no longer available."`), `Tenant.create({... status:"New" ...})`.
- **Remove:** the inner `try { leaseService.startRental(...) } catch { delete Tenant; 502 }` block entirely; the `successUrl/cancelUrl` destructuring/use.
- **New success:** `return res.status(200).json({ tenant: toTenantDTO(tenant) });`
- Outer `catch` unchanged: `400 { message: error.message }` (now surfaces the real validation error instead of being masked by 502).

### `loginTenantAndCreateLease` (`server/controllers/rentalController.js`)

- **Keep:** `email`/`password` presence (401), Tenant lookup by email+company (401), `comparePassword` (401), company/facility (404), unit vacancy (400).
- **Remove:** the `startRental` block + `successUrl/cancelUrl`.
- **New success:** `return res.status(200).json({ tenant: toTenantDTO(tenant) });`

### `toTenantDTO(tenant)` — small shared helper in `rentalController.js`

```js
function toTenantDTO(t) {
  return {
    _id: t._id,
    firstName: t.firstName,
    lastName: t.lastName,
    email: t.contactInfo?.email,
    phone: t.contactInfo?.phone,
    status: t.status,
  };
}
```
Defined once at module scope; used by both handlers. No other fields exposed.

### `createUnitCheckoutSession` (`server/controllers/paymentController.js`)

- After unit/company/Stripe-readiness checks and `resolvedSuccess/resolvedCancel`, before building `tenantShim`:
  - If `req.body.tenantId` is a valid ObjectId, `const realTenant = await Tenant.findById(req.body.tenantId);`
  - If `realTenant` found → pass to `startRental` a tenant object: `{ _id: realTenant._id, firstName: realTenant.firstName, lastName: realTenant.lastName, contactInfo: { email: realTenant.contactInfo?.email } }`.
  - Else (no `tenantId`, invalid, or not found) → existing `tenantShim` behaviour unchanged.
- Everything else unchanged: availability checks, `assertStripeReadyForCompany` + its status mapping (`404`/`409`), `startRental` error mapping (`409` price issues), `{ id, url, amount, currency, mode }` response.
- `Tenant` model import: add alongside existing imports (already imports `mongoose`, `StorageUnit`). Use `mongoose.Types.ObjectId.isValid` to guard the lookup.

### `RentalCheckout.jsx` (`client/src/components/rentalCenter/`)

- `createTenant()`: `setTenantInfo(response.data.tenant)` (was `response.data`). Keep returned success string + step advance.
- `loginTenant()`: `setTenantInfo(response.data.tenant)` (was `response.data`).
- `handleCheckout()`: add `tenantId: tenantInfo?._id` to the `/payments/unit-checkout-session` payload object. No other changes (it already builds `successUrl/cancelUrl` from `window.location.href` and redirects to `data.url`).

## Data flow

1. Wizard "save tenant" → `POST /rent` or `/login&rent` → Tenant persisted (`status:"New"`) → `{ tenant }` DTO → client stores `tenantInfo` (incl. `_id`).
2. Wizard "Pay" → `handleCheckout` → `POST /payments/unit-checkout-session` with `tenantId` → real Tenant loaded → `startRental` creates `Rental` (`status:"pending"`, real `tenant` ref, `checkoutSessionId`) + Stripe session → redirect to Stripe.
3. Tenant pays → `checkout.session.completed` webhook → `Rental.status:"paid"`.
4. Envelope created → tenant signs → DocuSign Connect webhook → `applyEnvelopeEvent` → `signingStatus:"signed"`, real `rental.tenant.status:"Active"`, gate provisioning on the real Tenant.

## Error handling

- `/rent` validation failures → existing `400`/`404` with real `error.message` (now user-visible, not masked as 502).
- Duplicate email → `400 "User already exists. Please Login."` (unchanged).
- `/payments/unit-checkout-session` → existing mapped statuses: `404` unit, `409` Stripe-not-ready / inactive-or-missing price, `400` missing URLs.
- Abandoned cart → Tenant remains `status:"New"` → existing `orphanCleanup` deletes after `ORPHAN_TENANT_AGE_DAYS`. No new code.
- No process-crash or unhandled-rejection paths; all errors are normal HTTP responses.

## Testing

### Rewrite `server/tests/controllers/rentalController.createTenantAndLease.test.js`
- Happy path: `200`; `res.body.tenant._id` truthy; `res.body.tenant.email` matches input; `res.body.tenant.status === "New"`; Tenant persisted; `startRental` (still mocked) asserted **not** called; request sends **no** `successUrl/cancelUrl`.
- Duplicate email → `400`; `startRental` not called.
- Invalid tenant info (e.g. weak password failing `passwordValidator`) → `400` with real message; no Tenant persisted.
- Security: `res.body.tenant` has no `password` and no `recoveryQuestions` keys.
- Remove the obsolete "rolls back Tenant if Stripe fails" test.

### Update `server/tests/controllers/rentalController.test.js` (`/login&rent`)
- Valid creds → `200` with `tenant` DTO (`_id`, `email`, `status`); `startRental` not called.
- 401 cases (no email match / wrong password) unchanged; `startRental` not called.

### New `server/tests/controllers/paymentController.unitCheckoutSession.tenant.test.js`
Mock `leaseService.startRental` (resolve `{ checkoutUrl, rentalId }`) and a `Rental.findById` returning a stub; seed company/facility/unit via factories; `assertStripeReadyForCompany` satisfied by factory company state (mirror existing payment tests' setup).
- `tenantId` present + Tenant exists → `startRental` called with `tenant._id === realTenant._id` and real email; `200`.
- `tenantId` absent → shim fallback; `200`; `startRental` called once.
- `tenantId` present but no such Tenant → shim fallback; `200`.

### Regression
`cd server && npm test` → 0 failures (existing `leaseService.startRental.test.js`, `rentalRoutes.ordering.test.js`, webhook tests untouched & green). `npm run lint` → no new warnings in changed files.

## Out of scope

- Changing `leaseService.startRental`, the Stripe/DocuSign webhooks, gate provisioning, or `orphanCleanup`.
- The `/payments/unit-checkout-session` response shape, URL resolution, or Stripe-readiness mapping (only the tenant-resolution branch is added).
- Any wizard step/UI redesign beyond the three `RentalCheckout.jsx` touch-points.
- Removing the legacy `tenantShim` fallback (kept for safety/back-compat).

## Risks

- **Client field name:** client must read `response.data.tenant` (was `response.data`). Both `createTenant` and `loginTenant` must change together or `handleCheckout` gets no `_id`. Covered by the explicit component list.
- **`tenantId` ObjectId validity:** guard with `mongoose.Types.ObjectId.isValid` before `findById` to avoid a cast throw; invalid → shim fallback (no 500).
- **Existing external callers of `/rent`/`/login&rent`** expecting `{checkoutUrl}`: none known (only the wizard). The route still exists; only the response body changes. Documented as accepted.
