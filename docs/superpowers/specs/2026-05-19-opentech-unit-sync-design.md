# OpenTech Per-Unit Sync (React-PMS as source of truth) — Design

**Date:** 2026-05-19
**Source request:** Per-unit OpenTech sync. React-PMS is the absolute source of truth. A Sync action pulls OpenTech units, creates React-PMS units that are missing in OpenTech, and vacate-then-deletes OpenTech units that do not exist in React-PMS. The Integrations page shows a cached "in sync / out of sync" badge, auto-rechecked on load; a manual Sync reconciles. Replaces the earlier manual per-unit mapping idea.
**Reference:** OpenTech IoE v2 swagger (173 paths). Builds on the existing gate integration (`openTechAdapter`, `gateService`, `gateController`, facility link/unlink, timegroups/accessprofiles sync).

## Goal

Eliminate the last manual step before a tenant can be provisioned: `StorageUnit.gateProviderRefs.opentech.unitId`. Today it is a hand Mongo edit per unit; provisioning throws `"Unit not linked to OpenTech"` without it. After this work, an operator clicks **Sync units** and React-PMS reconciles OpenTech's unit set to match its own, persisting the OpenTech-side unit IDs automatically.

## Locked-in decisions

| Decision | Choice |
|---|---|
| Source of truth | React-PMS, absolute |
| Match key | `unitNumber`, trimmed + case-insensitive |
| Unit in React-PMS, missing in OpenTech | Create it in OpenTech (`POST /facilities/{fid}/units`) |
| Unit in OpenTech, not in React-PMS | Vacate (`…/vacate`) then delete (`…/delete/vacant`) |
| Matched units | Ensure/repair `StorageUnit.gateProviderRefs.opentech.unitId` = OpenTech `id` |
| Out-of-sync status | Cached on Facility + auto-recheck on Integrations page load |
| Reconcile trigger | Manual **Sync units** button (`requireFacilityAdmin`) |
| Safety | Hard guard against mass deletion (see below) |

## Safety guard (non-negotiable)

The reconciliation is destructive and automatic. A mislinked facility, or a React-PMS facility with 0/few units while OpenTech is fully populated, would otherwise vacate + delete **every** OpenTech unit for that facility — locking out every real tenant, with no undo.

`syncUnits` aborts before any mutation and returns `{ blocked: true, wouldCreate, wouldDelete }` (HTTP 409) when **either**:

- React-PMS has **0** units for the facility, **or**
- the run would delete **> 20%** of OpenTech's current units for the facility.

The operator may override with an explicit `force: true` in the request body (UI shows a confirm dialog with the exact delete count first). Normal drift (a few units) passes the guard untouched.

## OpenTech v2 contracts used

| Op | Method/Path | Body | Response |
|---|---|---|---|
| List units | `GET /facilities/{fid}/units` | — | `UnitModel[]` |
| Create unit | `POST /facilities/{fid}/units` | `UnitPostModel` `{ unitNumber }` (required) | `UnitModel` (has `id`) |
| Vacate unit | `POST /facilities/{fid}/units/{uid}/vacate` | — | `UnitModel` |
| Delete vacant | `POST /facilities/{fid}/units/{uid}/delete/vacant` | — | `boolean` |

`UnitModel` = `{ id:int, unitNumber:string, status:string, facilityId:int, propertyNumber?, extendedData? }`.

## Components

### `server/services/gateProviders/openTechAdapter.js` — 4 new methods

- `listUnits({ facility })` → `GET /facilities/{fid}/units`; returns `[{ id:String, unitNumber, status }]`.
- `createUnit({ facility, unitNumber })` → `POST /facilities/{fid}/units` body `{ unitNumber }`; returns `{ id:String }` from `UnitModel`.
- `vacateUnit({ facility, unitId })` → `POST /facilities/{fid}/units/{uid}/vacate`.
- `deleteVacantUnit({ facility, unitId })` → `POST /facilities/{fid}/units/{uid}/delete/vacant`.

All go through the existing `authedRequest` (JWT cache, 401 refresh, 5XX backoff, `api-version: 2.0`).

### `server/services/gateService.js` — 2 new functions

`checkUnitSync({ facilityId })` — read-only:
1. Load Facility (+company); require `gateProvider` + `gateProviderRefs.opentech.facilityId`, else throw `"Facility not linked to OpenTech"`.
2. `adapter.listUnits()` + load `StorageUnit`s for the facility.
3. Key by `unitNumber.trim().toLowerCase()`. Compute `missingInOpenTech`, `extraInOpenTech`, `matched`.
4. `status = (missing.length === 0 && extra.length === 0) ? "in-sync" : "out-of-sync"`.
5. Persist `Facility.gateProviderRefs.opentech.unitSync = { status, lastCheckedAt, missing: missing.length, extra: extra.length, matched: matched.length }`.
6. Return that object plus the unit-number lists.

`syncUnits({ facilityId, force })` — reconciling:
1. Steps 1-3 of `checkUnitSync`.
2. **Safety guard:** if `ourUnits.length === 0` or `extra.length / otUnits.length > 0.20`, and not `force` → return `{ blocked: true, wouldCreate: missing.length, wouldDelete: extra.length }`, no mutations.
3. For each `missing` → `createUnit`, set `StorageUnit.gateProviderRefs.opentech.unitId`, save, Event `"Gate Unit Created"`.
4. For each `extra` → `vacateUnit` then `deleteVacantUnit`, Event `"Gate Unit Deleted"`.
5. For each `matched` → if `StorageUnit…unitId` ≠ OpenTech `id`, set + save (drift repair).
6. Per-unit failures are caught into `errors:[{ unitNumber, op, message }]`; the batch continues.
7. Persist `unitSync = { status, lastSyncAt, created, deleted, matched, errors }`; `status="in-sync"` only if zero residual discrepancies and zero errors, else `"out-of-sync"`. Event `"Gate Unit Sync"` with a summary message.
8. Return `{ created, deleted, matched, errors, status }`.

### `server/controllers/gateController.js` — 2 thin handlers

- `getUnitSyncStatus` → `checkUnitSync`. 200 with cached/recomputed status. `Facility not found`→404, `not linked`→400, adapter/auth failure→502 with underlying message.
- `syncUnits` → `gateService.syncUnits({ facilityId, force: req.body?.force === true })`. 200 on success; **409** with `{ blocked, wouldCreate, wouldDelete }` when guard-blocked; 400 not-linked; 502 adapter failure (surfacing message); 404 facility.

### Routing (`server/routes/facilityRoutes.js`)

```
GET  /facilities/:facilityId/gate/units/status  authenticateAPIKey, authenticate, requireFacilityAdmin
POST /facilities/:facilityId/gate/units/sync     authenticateAPIKey, authenticate, requireFacilityAdmin
```

(Same auth model as the existing `gate/link` routes.)

### Client (`IntegrationsSettings.jsx`)

Add a **Unit sync** section (only when the facility is linked):
- On load, GET `…/gate/units/status`; render badge from the returned cached state — green "In sync" or amber "Out of sync — N to create, M to remove", plus `lastSyncAt`/`lastCheckedAt`.
- **Sync units** button → POST `…/gate/units/sync`. On 200, toast `created/deleted/matched` summary and refresh status. On **409 blocked**, open a confirm dialog: "This will delete N OpenTech units (vacating their visitors). React-PMS has X units. Continue?" → on confirm, re-POST with `{ force: true }`.
- Errors list (if any) shown below the badge.
- Reuses existing axios + `x-api-key` + `react-hot-toast` + loading-state patterns in the file.

## Schema additions

```js
// Facility.gateProviderRefs.opentech
unitSync: {
  status: String,            // "in-sync" | "out-of-sync"
  lastCheckedAt: Date,
  lastSyncAt: Date,
  created: Number,
  deleted: Number,
  matched: Number,
  missing: Number,
  extra: Number,
  errors: [{ unitNumber: String, op: String, message: String }],
}
// StorageUnit.gateProviderRefs.opentech.unitId — already exists; now written by sync
// Event eventName enum += "Gate Unit Created", "Gate Unit Deleted", "Gate Unit Sync"
```

## Error handling

- Per-unit create/vacate/delete failure → captured in `errors[]`, batch continues; final `status="out-of-sync"`.
- `delete/vacant` failing after `vacate` (occupied race) → recorded as an error, non-fatal.
- Controller surfaces the underlying adapter message on 502 (consistent with prior error-surfacing fixes), never an opaque string.
- Every destructive op (`vacate`/`delete`) writes an Event row regardless of outcome — full audit trail.
- Guard block makes **zero** remote calls.

## Testing (TDD, server)

- **Adapter:** each new method hits the correct v2 path; `createUnit` sends `{ unitNumber }` and reads `id` from `UnitModel`; `api-version: 2.0` header present.
- **`syncUnits`:** creates missing + persists `unitId`; vacate-before-delete ordering for extras; matched-id drift repair; **guard blocks** at 0-ours and >20%-delete with no remote calls; `force` bypasses guard; per-unit error → `out-of-sync`, batch continues; Event rows written; `unitSync` persisted.
- **`checkUnitSync`:** read-only (no create/delete calls), correct status, caches on Facility.
- **Controller:** 400 not-linked; 409 guard-blocked with counts; 502 adapter failure surfaces message; happy path; `requireFacilityAdmin` 403 cross-company.
- **Client:** logic + lint only — no client test suite exists, no live OpenTech/browser walkthrough possible; stated honestly in the PR.

## Out of scope

- Pushing unit attribute updates (status/number) to OpenTech for matched units — only id linkage is repaired; attribute reconciliation is a later follow-up.
- Scheduled/automatic background reconciliation — sync is operator-triggered only.
- Multi-vendor unit sync (Nokē/PTI) — OpenTech only.
- Undo/restore of deleted OpenTech units — not possible via the API; the safety guard is the mitigation.

## Risks

- **Mass deletion** — mitigated by the safety guard (0-ours / >20% thresholds + explicit `force` confirm).
- **`unitNumber` convention drift** — exact (trimmed, case-insensitive) match only; mismatched numbering shows as create+delete churn. Operators see the counts before forcing; documented behavior.
- **Partial failure mid-run** — batch-continue + `errors[]` + `out-of-sync` status; re-running sync is idempotent (already-created units now match; already-deleted no longer present).
- **Client unverified** — no client tests / no live walkthrough in this environment; logic + lint only, stated in the PR.
