# OpenTech Per-Unit Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile OpenTech's unit set to match React-PMS (source of truth) so `StorageUnit.gateProviderRefs.opentech.unitId` is populated automatically, with a hard safety guard against mass deletion.

**Architecture:** Four new `openTechAdapter` methods (list/create/vacate/delete units) over the existing `authedRequest`. Two new `gateService` functions: `checkUnitSync` (read-only diff + cached status) and `syncUnits` (create-missing / vacate+delete-extra / repair-matched, guarded). Two thin `gateController` handlers + two `requireFacilityAdmin` routes. A "Unit sync" section in the Integrations tab.

**Tech Stack:** Node ESM, Express, Mongoose, Vitest + mongodb-memory-server + supertest; React 18 + axios + react-hot-toast.

---

## Spec

Source spec: `docs/superpowers/specs/2026-05-19-opentech-unit-sync-design.md`. Read it before starting.

## Conventions (read once)

- All server commands run from `server/`. Run a single test file with `npx vitest run <relpath>`. **If a run reports DB timeouts with `setup 0ms`, that's a known transient mongodb-memory-server flake — re-run once.** Final verification always uses the full suite (`npx vitest run`).
- `gateService.js` already has helpers: `loadFacilityWithCompany(facilityId)` (returns Facility with `company` populated), `pickAdapter(facility)`, `logEvent(eventName, facility, message)`, and imports `StorageFacility`, `StorageUnit`, `Rental`, `Event`, `openTechAdapter`.
- `Facility.gateProviderRefs` is persisted as a free-form object via `facility.markModified("gateProviderRefs")` (existing `syncFacilityResources` already stores arbitrary nested keys this way) — **no Facility schema change is needed** for `unitSync`.
- `StorageUnit.gateProviderRefs.opentech.unitId` already exists in the schema.
- Adapter test pattern: `tests/services/gateProviders/openTechAdapter.test.js` mocks `global.fetch` via `fetchMock`, uses `loadAdapter()` (`vi.resetModules()` + dynamic import) and a `makeFacility()` helper. First mocked fetch = auth token, second = the API call.
- Service test pattern: `tests/services/gateService.*.test.js` — real in-memory Mongo, factories `makeCompany/makeFacility/makeUnit`, adapter mocked via `vi.mock("../../services/gateProviders/openTechAdapter.js", ...)` with `vi.hoisted`.
- Controller test pattern: `tests/controllers/gateController.*.test.js` — `buildApp`, `api`, `cookieFor`, `makeUser`, `vi.mock` of `gateService.js` (mock EVERY named export the controller imports).

---

## Task 1: Extend Event eventName enum

**Files:**
- Modify: `server/models/event.js` (the `eventName` enum array)
- Test: `server/tests/unit/eventUnitSyncEnum.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `server/tests/unit/eventUnitSyncEnum.test.js`:

```js
import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";
import Event from "../../models/event.js";

describe("Event eventName — unit sync values", () => {
  for (const name of ["Gate Unit Created", "Gate Unit Deleted", "Gate Unit Sync"]) {
    it(`accepts "${name}" under Integration eventType`, async () => {
      const c = await makeCompany();
      const f = await makeFacility(c);
      const ev = await Event.create({
        eventType: "Integration",
        eventName: name,
        company: c._id,
        facility: f._id,
        message: "x",
      });
      expect(ev.eventName).toBe(name);
    });
  }
});
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/unit/eventUnitSyncEnum.test.js`
Expected: FAIL — validation error, `eventName` not in enum.

- [ ] **Step 3: Add the enum values**

In `server/models/event.js`, find the `eventName` field's `enum: [...]` array and append the three strings (keep existing entries unchanged):

```js
"Gate Unit Created",
"Gate Unit Deleted",
"Gate Unit Sync",
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/unit/eventUnitSyncEnum.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/models/event.js server/tests/unit/eventUnitSyncEnum.test.js
git commit -m "feat: add Gate Unit Created/Deleted/Sync event names"
```

---

## Task 2: adapter.listUnits

**Files:**
- Modify: `server/services/gateProviders/openTechAdapter.js` (add method to the `openTechAdapter` object)
- Test: `server/tests/services/gateProviders/openTechAdapter.test.js` (append a describe block)

- [ ] **Step 1: Write the failing test**

Append to `server/tests/services/gateProviders/openTechAdapter.test.js` (after the final `});` of the file):

```js
describe("openTechAdapter — units", () => {
  function uf() {
    return {
      _id: "f1",
      company: { _id: "c1", gateProviders: { opentech: { apiKey: "ak", apiSecret: "as" } } },
      gateProviderRefs: { opentech: { facilityId: "remote_f1" } },
    };
  }

  it("listUnits GETs /facilities/{fid}/units and maps id/unitNumber/status", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [{ id: 11, unitNumber: "A1", status: "Vacant" }],
    });

    const out = await adapter.listUnits({ facility: uf() });

    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/units"
    );
    expect(out).toEqual([{ id: "11", unitNumber: "A1", status: "Vacant" }]);
  });
});
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js -t "listUnits"`
Expected: FAIL — `adapter.listUnits is not a function`.

- [ ] **Step 3: Implement**

In `server/services/gateProviders/openTechAdapter.js`, inside the `const openTechAdapter = { ... }` object, add (after `listAccessProfiles`):

```js
  async listUnits({ facility }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)");
    const items = await authedRequest("GET", `/facilities/${fid}/units`, { facility });
    return (items || []).map((u) => ({
      id: String(u.id),
      unitNumber: u.unitNumber,
      status: u.status,
    }));
  },
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js -t "listUnits"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/services/gateProviders/openTechAdapter.js server/tests/services/gateProviders/openTechAdapter.test.js
git commit -m "feat: openTechAdapter.listUnits"
```

---

## Task 3: adapter.createUnit

**Files:**
- Modify: `server/services/gateProviders/openTechAdapter.js`
- Test: `server/tests/services/gateProviders/openTechAdapter.test.js`

- [ ] **Step 1: Write the failing test**

Add inside the `describe("openTechAdapter — units", ...)` block:

```js
  it("createUnit POSTs { unitNumber } and returns the new id", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ id: 99, unitNumber: "B2", status: "Vacant" }),
    });

    const res = await adapter.createUnit({ facility: uf(), unitNumber: "B2" });

    const call = fetchMock.mock.calls[1];
    expect(call[0]).toBe("https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/units");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body)).toEqual({ unitNumber: "B2" });
    expect(res).toEqual({ id: "99" });
  });
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js -t "createUnit"`
Expected: FAIL — `adapter.createUnit is not a function`.

- [ ] **Step 3: Implement**

Add to the `openTechAdapter` object after `listUnits`:

```js
  async createUnit({ facility, unitNumber }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech");
    const result = await authedRequest("POST", `/facilities/${fid}/units`, {
      facility,
      body: { unitNumber },
    });
    return { id: String(result?.id ?? result?.unitId) };
  },
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js -t "createUnit"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/services/gateProviders/openTechAdapter.js server/tests/services/gateProviders/openTechAdapter.test.js
git commit -m "feat: openTechAdapter.createUnit"
```

---

## Task 4: adapter.vacateUnit + deleteVacantUnit

**Files:**
- Modify: `server/services/gateProviders/openTechAdapter.js`
- Test: `server/tests/services/gateProviders/openTechAdapter.test.js`

- [ ] **Step 1: Write the failing test**

Add inside `describe("openTechAdapter — units", ...)`:

```js
  it("vacateUnit then deleteVacantUnit hit the correct paths", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: 11 }) });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => true });

    await adapter.vacateUnit({ facility: uf(), unitId: "11" });
    await adapter.deleteVacantUnit({ facility: uf(), unitId: "11" });

    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/units/11/vacate"
    );
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
    expect(fetchMock.mock.calls[2][0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/units/11/delete/vacant"
    );
    expect(fetchMock.mock.calls[2][1].method).toBe("POST");
  });
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js -t "vacateUnit then deleteVacantUnit"`
Expected: FAIL — `adapter.vacateUnit is not a function`.

- [ ] **Step 3: Implement**

Add to the `openTechAdapter` object after `createUnit`:

```js
  async vacateUnit({ facility, unitId }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech");
    await authedRequest("POST", `/facilities/${fid}/units/${unitId}/vacate`, { facility, body: {} });
  },
  async deleteVacantUnit({ facility, unitId }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech");
    await authedRequest("POST", `/facilities/${fid}/units/${unitId}/delete/vacant`, { facility, body: {} });
  },
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/services/gateProviders/openTechAdapter.test.js`
Expected: PASS (all adapter tests, including the 3 new unit tests).

- [ ] **Step 5: Commit**

```bash
git add server/services/gateProviders/openTechAdapter.js server/tests/services/gateProviders/openTechAdapter.test.js
git commit -m "feat: openTechAdapter.vacateUnit + deleteVacantUnit"
```

---

## Task 5: gateService.checkUnitSync (read-only diff + cache)

**Files:**
- Modify: `server/services/gateService.js` (add export; reuse `loadFacilityWithCompany`, `pickAdapter`, `StorageUnit`)
- Test: `server/tests/services/gateService.checkUnitSync.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/gateService.checkUnitSync.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

const { listUnits } = vi.hoisted(() => ({ listUnits: vi.fn() }));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(), healthCheck: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(), suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(), listUnits, createUnit: vi.fn(),
    vacateUnit: vi.fn(), deleteVacantUnit: vi.fn(),
  },
}));

import { checkUnitSync } from "../../services/gateService.js";

beforeEach(() => listUnits.mockReset());

async function linkedFacility() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return { c, f };
}

describe("gateService.checkUnitSync", () => {
  it("throws when facility not linked", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    await expect(checkUnitSync({ facilityId: f._id })).rejects.toThrow("Facility not linked to OpenTech");
  });

  it("reports out-of-sync and caches counts on the facility", async () => {
    const { f } = await linkedFacility();
    await makeUnit(f, { unitNumber: "A1" }); // matched
    await makeUnit(f, { unitNumber: "A2" }); // missing in OpenTech
    listUnits.mockResolvedValue([
      { id: "11", unitNumber: "A1", status: "Vacant" }, // matched
      { id: "99", unitNumber: "Z9", status: "Vacant" }, // extra in OpenTech
    ]);

    const res = await checkUnitSync({ facilityId: f._id });

    expect(res.status).toBe("out-of-sync");
    expect(res.missing).toEqual(["A2"]);
    expect(res.extra).toEqual(["Z9"]);
    expect(res.matched).toBe(1);

    const reloaded = await StorageFacility.findById(f._id);
    const us = reloaded.gateProviderRefs.opentech.unitSync;
    expect(us.status).toBe("out-of-sync");
    expect(us.missing).toBe(1);
    expect(us.extra).toBe(1);
    expect(us.matched).toBe(1);
    expect(us.lastCheckedAt).toBeInstanceOf(Date);
  });

  it("reports in-sync when sets match (case/space-insensitive)", async () => {
    const { f } = await linkedFacility();
    await makeUnit(f, { unitNumber: "A1" });
    listUnits.mockResolvedValue([{ id: "11", unitNumber: " a1 ", status: "Vacant" }]);

    const res = await checkUnitSync({ facilityId: f._id });
    expect(res.status).toBe("in-sync");
  });
});
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/services/gateService.checkUnitSync.test.js`
Expected: FAIL — `checkUnitSync` is not exported.

- [ ] **Step 3: Implement**

In `server/services/gateService.js`, add (place near the other exported functions, e.g. after `setDefaults`):

```js
function normUnitKey(s) {
  return String(s ?? "").trim().toLowerCase();
}

async function diffUnits(facility, adapter) {
  const otUnits = await adapter.listUnits({ facility });
  const ourUnits = await StorageUnit.find({ facility: facility._id });
  const otByKey = new Map(otUnits.map((u) => [normUnitKey(u.unitNumber), u]));
  const ourByKey = new Map(ourUnits.map((u) => [normUnitKey(u.unitNumber), u]));
  const missing = ourUnits.filter((u) => !otByKey.has(normUnitKey(u.unitNumber)));
  const extra = otUnits.filter((u) => !ourByKey.has(normUnitKey(u.unitNumber)));
  const matched = ourUnits.filter((u) => otByKey.has(normUnitKey(u.unitNumber)));
  return { otUnits, ourUnits, otByKey, missing, extra, matched };
}

function persistUnitSync(facility, patch) {
  const provider = facility.gateProvider;
  facility.gateProviderRefs = facility.gateProviderRefs || {};
  facility.gateProviderRefs[provider] = facility.gateProviderRefs[provider] || {};
  facility.gateProviderRefs[provider].unitSync = {
    ...(facility.gateProviderRefs[provider].unitSync || {}),
    ...patch,
  };
  facility.markModified("gateProviderRefs");
}

export async function checkUnitSync({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!facility.gateProvider || !adapter) throw new Error("Facility not linked to OpenTech");

  const { missing, extra, matched } = await diffUnits(facility, adapter);
  const status = missing.length === 0 && extra.length === 0 ? "in-sync" : "out-of-sync";
  persistUnitSync(facility, {
    status,
    lastCheckedAt: new Date(),
    missing: missing.length,
    extra: extra.length,
    matched: matched.length,
  });
  await facility.save();
  return {
    status,
    missing: missing.map((u) => u.unitNumber),
    extra: extra.map((u) => u.unitNumber),
    matched: matched.length,
  };
}
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/services/gateService.checkUnitSync.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/services/gateService.js server/tests/services/gateService.checkUnitSync.test.js
git commit -m "feat: gateService.checkUnitSync (read-only unit diff + cached status)"
```

---

## Task 6: gateService.syncUnits — happy path (create / delete / repair)

**Files:**
- Modify: `server/services/gateService.js`
- Test: `server/tests/services/gateService.syncUnits.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/gateService.syncUnits.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import StorageUnit from "../../models/unit.js";
import Event from "../../models/event.js";

const { listUnits, createUnit, vacateUnit, deleteVacantUnit } = vi.hoisted(() => ({
  listUnits: vi.fn(), createUnit: vi.fn(), vacateUnit: vi.fn(), deleteVacantUnit: vi.fn(),
}));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(), healthCheck: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(), suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(), listUnits, createUnit, vacateUnit, deleteVacantUnit,
  },
}));

import { syncUnits } from "../../services/gateService.js";

beforeEach(() => {
  listUnits.mockReset(); createUnit.mockReset();
  vacateUnit.mockReset(); deleteVacantUnit.mockReset();
});

async function linked() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return { c, f };
}

describe("gateService.syncUnits — happy path", () => {
  it("creates missing in OpenTech, vacate+deletes extras, repairs matched ids", async () => {
    const { f } = await linked();
    const a1 = await makeUnit(f, { unitNumber: "A1" }); // matched, no unitId yet
    await makeUnit(f, { unitNumber: "A2" });            // missing in OpenTech
    listUnits.mockResolvedValue([
      { id: "11", unitNumber: "A1", status: "Vacant" }, // matched -> repair id
      { id: "99", unitNumber: "Z9", status: "Vacant" }, // extra -> vacate+delete
    ]);
    createUnit.mockResolvedValue({ id: "22" });
    vacateUnit.mockResolvedValue();
    deleteVacantUnit.mockResolvedValue();

    const res = await syncUnits({ facilityId: f._id });

    expect(res.status).toBe("in-sync");
    expect(res.created).toBe(1);
    expect(res.deleted).toBe(1);
    expect(res.matched).toBe(1);
    expect(res.errors).toEqual([]);

    expect(createUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitNumber: "A2" });
    expect(vacateUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitId: "99" });
    expect(deleteVacantUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitId: "99" });

    const reA1 = await StorageUnit.findById(a1._id);
    expect(reA1.gateProviderRefs.opentech.unitId).toBe("11");
    const reA2 = await StorageUnit.findOne({ facility: f._id, unitNumber: "A2" });
    expect(reA2.gateProviderRefs.opentech.unitId).toBe("22");

    const events = await Event.find({ facility: f._id, eventType: "Integration" });
    const names = events.map((e) => e.eventName);
    expect(names).toContain("Gate Unit Created");
    expect(names).toContain("Gate Unit Deleted");
    expect(names).toContain("Gate Unit Sync");
  });
});
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/services/gateService.syncUnits.test.js`
Expected: FAIL — `syncUnits` is not exported.

- [ ] **Step 3: Implement**

In `server/services/gateService.js`, add after `checkUnitSync`:

```js
function setUnitRemoteId(unit, provider, id) {
  unit.gateProviderRefs = unit.gateProviderRefs || {};
  unit.gateProviderRefs[provider] = unit.gateProviderRefs[provider] || {};
  unit.gateProviderRefs[provider].unitId = String(id);
  unit.markModified("gateProviderRefs");
}

export async function syncUnits({ facilityId, force = false }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!facility.gateProvider || !adapter) throw new Error("Facility not linked to OpenTech");
  const provider = facility.gateProvider;

  const { otUnits, ourUnits, otByKey, missing, extra, matched } = await diffUnits(facility, adapter);

  // Safety guard
  const zeroOurs = ourUnits.length === 0;
  const overDeleteRatio = otUnits.length > 0 && extra.length / otUnits.length > 0.2;
  if (!force && (zeroOurs || overDeleteRatio)) {
    return { blocked: true, wouldCreate: missing.length, wouldDelete: extra.length };
  }

  const errors = [];
  let created = 0;
  let deleted = 0;

  for (const u of missing) {
    try {
      const { id } = await adapter.createUnit({ facility, unitNumber: u.unitNumber });
      setUnitRemoteId(u, provider, id);
      await u.save();
      await logEvent("Gate Unit Created", facility, `Unit ${u.unitNumber} -> OpenTech ${id}`);
      created += 1;
    } catch (e) {
      errors.push({ unitNumber: u.unitNumber, op: "create", message: e.message });
    }
  }

  for (const ot of extra) {
    try {
      await adapter.vacateUnit({ facility, unitId: ot.id });
      await adapter.deleteVacantUnit({ facility, unitId: ot.id });
      await logEvent("Gate Unit Deleted", facility, `Vacated+deleted OpenTech unit ${ot.unitNumber} (${ot.id})`);
      deleted += 1;
    } catch (e) {
      errors.push({ unitNumber: ot.unitNumber, op: "delete", message: e.message });
    }
  }

  for (const u of matched) {
    const ot = otByKey.get(normUnitKey(u.unitNumber));
    if (ot && u.gateProviderRefs?.[provider]?.unitId !== String(ot.id)) {
      setUnitRemoteId(u, provider, ot.id);
      await u.save();
    }
  }

  const status =
    errors.length === 0 && missing.length === created && extra.length === deleted
      ? "in-sync"
      : "out-of-sync";

  persistUnitSync(facility, {
    status,
    lastSyncAt: new Date(),
    lastCheckedAt: new Date(),
    created,
    deleted,
    matched: matched.length,
    missing: missing.length - created,
    extra: extra.length - deleted,
    errors,
  });
  await facility.save();
  await logEvent(
    "Gate Unit Sync",
    facility,
    `created ${created}, deleted ${deleted}, matched ${matched.length}, errors ${errors.length}`
  );

  return { status, created, deleted, matched: matched.length, errors };
}
```

- [ ] **Step 4: Run it, observe pass**

Run: `npx vitest run tests/services/gateService.syncUnits.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add server/services/gateService.js server/tests/services/gateService.syncUnits.test.js
git commit -m "feat: gateService.syncUnits create/delete/repair reconciliation"
```

---

## Task 7: gateService.syncUnits — safety guard

**Files:**
- Modify: none (behavior already implemented in Task 6 — this task adds tests proving it)
- Test: `server/tests/services/gateService.syncUnits.test.js` (append)

- [ ] **Step 1: Write the failing test**

Append a new `describe` to `server/tests/services/gateService.syncUnits.test.js`:

```js
describe("gateService.syncUnits — safety guard", () => {
  it("blocks when React-PMS has 0 units and makes no remote calls", async () => {
    const { f } = await linked();
    listUnits.mockResolvedValue([
      { id: "1", unitNumber: "A1", status: "Vacant" },
      { id: "2", unitNumber: "A2", status: "Vacant" },
    ]);

    const res = await syncUnits({ facilityId: f._id });

    expect(res).toEqual({ blocked: true, wouldCreate: 0, wouldDelete: 2 });
    expect(vacateUnit).not.toHaveBeenCalled();
    expect(deleteVacantUnit).not.toHaveBeenCalled();
    expect(createUnit).not.toHaveBeenCalled();
  });

  it("blocks when deletion would exceed 20% of OpenTech units", async () => {
    const { f } = await linked();
    await makeUnit(f, { unitNumber: "A1" });
    await makeUnit(f, { unitNumber: "A2" });
    // 10 OT units, 8 not in ours -> 80% delete -> blocked
    listUnits.mockResolvedValue([
      { id: "1", unitNumber: "A1", status: "Vacant" },
      { id: "2", unitNumber: "A2", status: "Vacant" },
      ...Array.from({ length: 8 }, (_, i) => ({ id: String(100 + i), unitNumber: `X${i}`, status: "Vacant" })),
    ]);

    const res = await syncUnits({ facilityId: f._id });
    expect(res.blocked).toBe(true);
    expect(res.wouldDelete).toBe(8);
    expect(deleteVacantUnit).not.toHaveBeenCalled();
  });

  it("force:true bypasses the guard and performs deletions", async () => {
    const { f } = await linked();
    await makeUnit(f, { unitNumber: "A1" });
    listUnits.mockResolvedValue([
      { id: "1", unitNumber: "A1", status: "Vacant" },
      { id: "2", unitNumber: "Z1", status: "Vacant" },
      { id: "3", unitNumber: "Z2", status: "Vacant" },
    ]);
    vacateUnit.mockResolvedValue();
    deleteVacantUnit.mockResolvedValue();

    const res = await syncUnits({ facilityId: f._id, force: true });
    expect(res.blocked).toBeUndefined();
    expect(res.deleted).toBe(2);
    expect(deleteVacantUnit).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run it, observe pass (behavior already implemented)**

Run: `npx vitest run tests/services/gateService.syncUnits.test.js`
Expected: PASS (all syncUnits tests). If any guard test fails, fix the guard logic in `syncUnits` (the `zeroOurs`/`overDeleteRatio` block) until green — do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add server/tests/services/gateService.syncUnits.test.js
git commit -m "test: syncUnits safety guard (0-ours, >20% delete, force bypass)"
```

---

## Task 8: gateService.syncUnits — partial-failure resilience

**Files:**
- Modify: none (Task 6 already batch-continues on per-unit error)
- Test: `server/tests/services/gateService.syncUnits.test.js` (append)

- [ ] **Step 1: Write the failing test**

Append to `server/tests/services/gateService.syncUnits.test.js`:

```js
describe("gateService.syncUnits — partial failure", () => {
  it("continues the batch and reports out-of-sync with errors", async () => {
    const { f } = await linked();
    await makeUnit(f, { unitNumber: "A1" }); // create -> fails
    await makeUnit(f, { unitNumber: "A2" }); // create -> ok
    listUnits.mockResolvedValue([]); // both missing, no extras
    createUnit
      .mockRejectedValueOnce(new Error("OpenTech 500 boom"))
      .mockResolvedValueOnce({ id: "55" });

    const res = await syncUnits({ facilityId: f._id });

    expect(res.status).toBe("out-of-sync");
    expect(res.created).toBe(1);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toMatchObject({ op: "create", message: "OpenTech 500 boom" });
  });
});
```

- [ ] **Step 2: Run it, observe pass**

Run: `npx vitest run tests/services/gateService.syncUnits.test.js`
Expected: PASS. If it fails, ensure the `for (const u of missing)` loop wraps each `createUnit` in try/catch pushing to `errors` (already in Task 6 code) — fix until green.

- [ ] **Step 3: Commit**

```bash
git add server/tests/services/gateService.syncUnits.test.js
git commit -m "test: syncUnits partial-failure resilience"
```

---

## Task 9: gateController handlers + routes

**Files:**
- Modify: `server/controllers/gateController.js`, `server/routes/facilityRoutes.js`
- Test: `server/tests/controllers/gateController.unitSync.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/gateController.unitSync.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

const { checkUnitSync, syncUnits } = vi.hoisted(() => ({
  checkUnitSync: vi.fn(), syncUnits: vi.fn(),
}));

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(), getStatus: vi.fn(),
  listUnprovisioned: vi.fn(), provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: vi.fn(), unsuspendUnit: vi.fn(), retryProvisionTenant: vi.fn(),
  linkFacility: vi.fn(), unlinkFacility: vi.fn(),
  checkUnitSync, syncUnits,
}));

let app, cookie;
beforeEach(async () => {
  checkUnitSync.mockReset(); syncUnits.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /facilities/:facilityId/gate/units/status", () => {
  it("200 with status payload", async () => {
    const f = await makeFacility(await makeCompany());
    checkUnitSync.mockResolvedValue({ status: "out-of-sync", missing: ["A2"], extra: [], matched: 3 });
    const res = await api(app).get(`/facilities/${f._id}/gate/units/status`).set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("out-of-sync");
  });

  it("400 when not linked", async () => {
    const f = await makeFacility(await makeCompany());
    checkUnitSync.mockRejectedValue(new Error("Facility not linked to OpenTech"));
    const res = await api(app).get(`/facilities/${f._id}/gate/units/status`).set("Cookie", cookie);
    expect(res.status).toBe(400);
  });
});

describe("POST /facilities/:facilityId/gate/units/sync", () => {
  it("200 on success", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ status: "in-sync", created: 1, deleted: 0, matched: 2, errors: [] });
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(syncUnits).toHaveBeenCalledWith({ facilityId: f._id.toString(), force: false });
  });

  it("409 when guard-blocked, passing counts", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ blocked: true, wouldCreate: 0, wouldDelete: 9 });
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(409);
    expect(res.body.wouldDelete).toBe(9);
  });

  it("passes force:true through", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ status: "in-sync", created: 0, deleted: 9, matched: 0, errors: [] });
    await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({ force: true });
    expect(syncUnits).toHaveBeenCalledWith({ facilityId: f._id.toString(), force: true });
  });

  it("502 surfaces adapter failure message", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockRejectedValue(new Error("OpenTech GET /facilities/1/units failed: 500"));
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/units failed: 500/);
  });
});
```

- [ ] **Step 2: Run it, observe failure**

Run: `npx vitest run tests/controllers/gateController.unitSync.test.js`
Expected: FAIL — routes 404 / handlers undefined.

- [ ] **Step 3: Implement the handlers**

In `server/controllers/gateController.js`, add two exports (anywhere among the others):

```js
export const getUnitSyncStatus = async (req, res) => {
  try {
    const result = await gateService.checkUnitSync({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/units/status failed:", msg);
    return res.status(502).json({ message: `Unit sync status failed: ${msg}` });
  }
};

export const syncUnits = async (req, res) => {
  try {
    const result = await gateService.syncUnits({
      facilityId: req.params.facilityId,
      force: req.body?.force === true,
    });
    if (result?.blocked) return res.status(409).json(result);
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/units/sync failed:", msg);
    return res.status(502).json({ message: `Unit sync failed: ${msg}` });
  }
};
```

- [ ] **Step 4: Wire the routes**

In `server/routes/facilityRoutes.js`, next to the existing `router.put("/:facilityId/gate/link", ...)` lines, add:

```js
router.get("/:facilityId/gate/units/status", authenticateAPIKey, authenticate, requireFacilityAdmin, gateController.getUnitSyncStatus);
router.post("/:facilityId/gate/units/sync", authenticateAPIKey, authenticate, requireFacilityAdmin, gateController.syncUnits);
```

- [ ] **Step 5: Run it, observe pass**

Run: `npx vitest run tests/controllers/gateController.unitSync.test.js`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add server/controllers/gateController.js server/routes/facilityRoutes.js server/tests/controllers/gateController.unitSync.test.js
git commit -m "feat: gate unit-sync status + sync endpoints (requireFacilityAdmin)"
```

---

## Task 10: Client — Unit sync section in the Integrations tab

**Files:**
- Modify: `client/src/components/facilityComponents/settingsComponents/IntegrationsSettings.jsx`

No client test suite exists — verification is `npm run lint` + manual. Follow the file's existing axios/`x-api-key`/`react-hot-toast` patterns.

- [ ] **Step 1: Add state**

In `IntegrationsSettings.jsx`, alongside the other `useState` declarations, add:

```jsx
  const [unitSync, setUnitSync] = useState(null);
  const [isUnitSyncing, setIsUnitSyncing] = useState(false);
```

- [ ] **Step 2: Add status loader + handlers**

After the existing `loadStatus` definition, add:

```jsx
  const loadUnitSync = useCallback(() => {
    if (!facilityId) return;
    return axios
      .get(`/facilities/${facilityId}/gate/units/status`, {
        headers: { "x-api-key": API_KEY },
      })
      .then(({ data }) => setUnitSync(data))
      .catch((err) => {
        if (err?.response?.status !== 400) {
          console.error("Failed to load unit sync status:", err);
        }
      });
  }, [facilityId]);

  const runUnitSync = (force) => {
    setIsUnitSyncing(true);
    axios
      .post(
        `/facilities/${facilityId}/gate/units/sync`,
        { force: !!force },
        { headers: { "x-api-key": API_KEY } }
      )
      .then(({ data }) => {
        toast.success(
          `Units synced — created ${data.created}, removed ${data.deleted}, matched ${data.matched}.`
        );
        return loadUnitSync();
      })
      .catch((err) => {
        const r = err?.response;
        if (r?.status === 409 && r.data?.blocked) {
          if (
            window.confirm(
              `This will DELETE ${r.data.wouldDelete} OpenTech unit(s) (vacating their visitors) and create ${r.data.wouldCreate}. React-PMS is the source of truth. Continue?`
            )
          ) {
            return runUnitSync(true);
          }
          return;
        }
        console.error("Unit sync failed:", err);
        toast.error(r?.data?.message || "Unit sync failed.");
      })
      .finally(() => setIsUnitSyncing(false));
  };
```

- [ ] **Step 3: Load on mount**

In the existing `useEffect` that calls `loadStatus()`, add `loadUnitSync();` next to `loadStatus();` and add `loadUnitSync` to that effect's dependency array.

- [ ] **Step 4: Render the section**

Inside the linked-state JSX (the branch shown when `status` is present and a provider is set — where the sync/defaults panel renders), add this block after the time-group/access-profile controls:

```jsx
      <div className="border-t pt-4 mt-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Unit sync</h2>
          {unitSync && (
            <span
              className={
                unitSync.status === "in-sync"
                  ? "text-green-600 text-sm font-medium"
                  : "text-amber-600 text-sm font-medium"
              }
            >
              {unitSync.status === "in-sync" ? "In sync" : "Out of sync"}
            </span>
          )}
        </div>
        {unitSync && unitSync.status !== "in-sync" && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {(unitSync.missing?.length ?? 0)} to create in OpenTech,{" "}
            {(unitSync.extra?.length ?? 0)} to remove from OpenTech.
          </p>
        )}
        <button
          type="button"
          disabled={isUnitSyncing}
          onClick={() => runUnitSync(false)}
          className="mt-2 px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {isUnitSyncing ? "Syncing units…" : "Sync units"}
        </button>
      </div>
```

- [ ] **Step 5: Lint**

Run (from `client/`): `npx eslint src/components/facilityComponents/settingsComponents/IntegrationsSettings.jsx`
Expected: clean (exit 0). Fix any issues (unused vars, missing hook deps) until clean.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/facilityComponents/settingsComponents/IntegrationsSettings.jsx
git commit -m "feat: unit sync section in Integrations tab (status badge + guarded sync)"
```

---

## Task 11: Full verification + docs + PR

**Files:**
- Modify: `server/CLAUDE.md` (Gate provider section)

- [ ] **Step 1: Full server suite**

Run (from `server/`): `npx vitest run`
Expected: all tests PASS (re-run once if the mongodb-memory-server flake appears: mass DB timeouts with `setup 0ms`).

- [ ] **Step 2: Server lint**

Run (from `server/`): `npx eslint controllers/gateController.js services/gateService.js services/gateProviders/openTechAdapter.js routes/facilityRoutes.js models/event.js`
Expected: no NEW errors/warnings on changed lines. If unsure whether a warning is pre-existing, `git stash` and re-lint baseline to confirm.

- [ ] **Step 3: Update server/CLAUDE.md**

In `server/CLAUDE.md`, under the OpenTech "Per-Unit setup" note, replace the manual-Mongo instruction with:

```
Per-unit linkage is automatic: open Settings → Integrations and click
"Sync units". React-PMS is the source of truth — it creates missing
units in OpenTech and vacate+deletes OpenTech units not in React-PMS.
A safety guard blocks runs that would delete >20% of OpenTech units or
when React-PMS has 0 units (override via the confirm dialog).
```

- [ ] **Step 4: Commit**

```bash
git add server/CLAUDE.md
git commit -m "docs: per-unit OpenTech linkage is now automatic via unit sync"
```

- [ ] **Step 5: Push + PR**

```bash
git push -u origin claude/gate-unit-sync
```

Then `gh pr create --base main --title "OpenTech per-unit sync (React-PMS source of truth)"` with a body covering: summary, the destructive vacate+delete behavior and the safety guard, test plan (full suite count), and the honest caveat that the client section is logic+lint verified only (no client tests / no live OpenTech or browser walkthrough in this environment).

---

## Self-Review

- **Spec coverage:** adapter listUnits/createUnit/vacateUnit/deleteVacantUnit (T2-4); checkUnitSync read-only + cache (T5); syncUnits create/delete/repair + Events + persisted unitSync (T6); safety guard 0-ours/>20%/force (T7); partial-failure batch-continue (T8); controller 200/400/409/502 + force passthrough + requireFacilityAdmin routes (T9); client badge + guarded sync + confirm (T10); Event enum (T1); docs + PR (T11). All spec sections covered.
- **Placeholder scan:** every code/test step contains complete code. T11 Step 5 describes the PR body in prose (author-written at PR time) rather than a placeholder token.
- **Type consistency:** `normUnitKey`/`diffUnits`/`persistUnitSync` defined in T5 and reused by `syncUnits` in T6; `setUnitRemoteId` defined+used in T6; `syncUnits` returns `{status,created,deleted,matched,errors}` or `{blocked,wouldCreate,wouldDelete}` — consumed exactly so by controller (T9) and client (T10); `checkUnitSync` returns `{status,missing[],extra[],matched}` consumed consistently in T9/T10.
- **requireFacilityAdmin** is already imported in `facilityRoutes.js` (used by gate/link) — no new import needed.
- **Adapter mock completeness:** service/controller test mocks list every adapter/gateService export currently imported, plus the new ones, preventing "is not a function" mock gaps.
