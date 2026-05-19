# Facility-Level Settings — Design

**Date:** 2026-05-18
**Status:** Approved (pending written-spec review)

## Problem

Operational config is currently company-wide or hardcoded:

- `server/processes/delinquency.js` hardcodes a 7-day grace period and applies **no late fees**.
- `server/processes/monthly.js` bills every tenant simultaneously (acknowledged in inline comments).
- There is no per-facility place for business/access hours, public contact info, or general
  preferences (timezone, currency).

Facilities need their own configurable billing/delinquency rules, hours, contact/display info,
and general preferences.

## Scope

In scope (four settings groups):

1. **Billing & delinquency rules** — per-facility grace-period days and a flat + percent late fee
   (one-time, applied once when the grace period lapses). Replaces the hardcoded 7-day rule and
   adds the currently-missing late fees.
2. **Business / access hours** — office hours and gate-access hours per facility (display data;
   gate-time-group wiring is future work).
3. **Contact & display info** — public-facing phone, email, and an announcement/notice string.
4. **General preferences** — timezone, currency, auto-suspend-on-delinquency toggle,
   notification email override.

Out of scope (flagged as future work):

- Per-facility billing-cycle rewrite in `monthly.js` (the "bill on last payment date instead of
  all-at-once" rework). `monthly.js` will only be made to read settings defensively with no
  behavioral change.
- Feeding `hours.gateAccess` into OpenTech gate time groups.

## Permissions

JWT currently carries only `_id`; there is **no server-side role enforcement anywhere** today.
This feature introduces the first such guard, `requireFacilityAdmin`:

- Load `User` by `req.user._id`.
- Allow if `user.role === "System_Admin"`.
- If `user.role === "Company_Admin"`: load the target facility; allow only if
  `facility.company` equals `user.company`.
- Otherwise (`Company_User`, `System_User`, mismatch) → `403`, including for reads.

## Approach

Chosen: **dedicated settings sub-resource** mirroring the existing
`/facilities/:facilityId/gate/*` sub-resource pattern. Settings are stored embedded under
`Facility.settings.*` (no new collection). Rejected alternatives: overloading the unauthenticated
`editFacility` handler (mixes concerns, clobber-prone); a separate `FacilitySettings` collection
(over-engineered, adds a join).

## Data model (`Facility.settings`, additive)

Existing `settings.amenities` and `settings.unitTypes` are untouched. New optional sub-objects,
all with defaults so existing facilities keep working:

```
settings.billing = {
  gracePeriodDays:  Number  (default 7, min 0)
  lateFee: {
    flatAmount:     Number  (default 0, min 0)
    percentOfRent:  Number  (default 0, min 0, max 100)
  }
  autoSuspendOnDelinquency: Boolean (default true)
}
settings.hours = {
  office:     [{ day: String, open: String, close: String, closed: Boolean }]  // up to 7
  gateAccess: [{ day: String, open: String, close: String, closed: Boolean }]  // up to 7
}
settings.contact = {
  publicPhone:  String
  publicEmail:  String  (lowercase, email-validated)
  announcement: String  (maxlength 1000)
}
settings.general = {
  timezone:                  String (IANA, default "America/Chicago")
  currency:                  String (ISO 4217, default "USD")
  notificationEmailOverride: String (email-validated, optional)
}
```

`day` values are `"Mon".."Sun"`; `open`/`close` are `"HH:MM"` 24h strings. Validation rejects
`percentOfRent` outside 0–100 and negative `flatAmount`/`gracePeriodDays`.

## API

- `GET /facilities/:facilityId/settings` → returns the four groups with defaults filled in.
- `PUT /facilities/:facilityId/settings` → accepts any subset of the four groups; **deep-merges**
  into `Facility.settings` (never replaces `amenities`/`unitTypes`); `runValidators: true`;
  writes a `Facility Settings Updated` Event.
- Both routes: `authenticate` → `requireFacilityAdmin` → controller.

Merge semantics: a `PUT` containing only `billing` updates only `settings.billing` and leaves
`hours`, `contact`, `general`, `amenities`, `unitTypes` intact. Implemented via targeted
`$set` on `settings.<group>` dotted paths rather than replacing `settings`.

## Behavior wiring

`server/processes/delinquency.js`:

- For each overdue unit, resolve its facility's `settings.billing.gracePeriodDays`
  (fallback `7` if unset) and compute overdue against that instead of the hardcoded week.
- On the `Rented → Delinquent` transition, apply the late fee **once**:
  `fee = flatAmount + (percentOfRent / 100) * unitMonthlyPrice`, then `$inc` the tenant's
  `balance` by `fee`.
- Idempotency: a `lateFeeAppliedAt` timestamp on the **Rental** marks that a fee was charged
  for the current delinquency cycle. The job skips fee application if `lateFeeAppliedAt` is set.
  The marker is cleared when a payment transitions the rental out of delinquency (in the
  existing payment/checkout success path that resets delinquency).
- If `settings.billing.autoSuspendOnDelinquency` is `false`, skip the `gateService.suspendUnit`
  call but still mark the tenant `Delinquent`.

`server/processes/monthly.js`:

- No behavioral change. May read `settings` defensively only if needed; must not regress the
  current all-at-once balance increment.

## Client

A **Settings** tab on the facility detail page with four collapsible sub-sections (Billing,
Hours, Contact, General). Tailwind forms, existing `react-hot-toast` feedback, calling the two
endpoints with `withCredentials`. The tab is hidden or rendered read-only for non-admins based
on the role already present in the client auth context (server remains the enforcement point of
truth). No client test suite exists, so no client tests are added.

## Testing (server, Vitest)

- Controller: happy path for each group; partial `PUT` (only `billing`) preserves `amenities`
  and other groups; validation rejects `percentOfRent > 100` and negative values.
- Middleware `requireFacilityAdmin`: `System_Admin` allowed; `Company_Admin` same-company
  allowed; `Company_Admin` cross-company `403`; `Company_User` `403` on both GET and PUT;
  unauthenticated `401`.
- Delinquency: grace-period override is honored (custom days); one-time late-fee math
  (`flat + percent`) is correct; rerun does not double-charge (`lateFeeAppliedAt` guard);
  `autoSuspendOnDelinquency: false` skips gate suspend but still marks delinquent.

## Risks

- **Late-fee idempotency** is the riskiest detail. Mitigation: per-Rental `lateFeeAppliedAt`
  timestamp, set on charge, cleared on the payment path that clears delinquency. Tested for
  no-double-charge on job rerun.
- First server-side auth guard — must not weaken existing routes; the guard is added only to the
  two new settings routes.
- `editFacility` already accepts and whole-replaces `settings`; this feature does not change
  `editFacility`, but the new PUT must use dotted `$set` paths so the two paths cannot clobber
  `amenities`/`unitTypes`.

## Future work

- Per-facility billing-cycle rewrite in `monthly.js`.
- Wire `hours.gateAccess` into OpenTech gate time groups.
- Recurring (vs one-time) late-fee option.
