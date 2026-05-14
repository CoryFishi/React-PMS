# OpenTech Gate Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a tenant pays + signs a lease, provision them as a visitor in their facility's gate system (OpenTech first). When the lease is declined/voided, revoke. When the delinquency cron runs, suspend overdue units.

**Architecture:** Pluggable `GateProviderAdapter` interface (vendor-agnostic) + `openTechAdapter` (first implementation against `*.insomniaccia.com`) + `gateService` orchestrator that picks the adapter per-Facility and writes Event rows. Hooks into existing `applyEnvelopeEvent` (sub-project 2) and `delinquency.js`. Schema additions on Company/Facility/StorageUnit/Rental store credentials + provider-side foreign IDs.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest, built-in `node:fetch` (no new dependency), `node:crypto` for access code generation.

**Source spec:** [docs/superpowers/specs/2026-05-14-gate-integration-opentech-design.md](../specs/2026-05-14-gate-integration-opentech-design.md)

## Spec adaptations (intentional)

- **`delinquency.js` bugs are NOT fixed in this sub-project.** Existing code queries `Tenant.status: "Rented"` (not in the enum). The hook adds `gateService.suspendUnit` inside the existing per-unit loop without changing query semantics. Tests seed tenants via `.collection.updateOne` (same workaround as orphanCleanup).
- **`unsuspendUnit` is implemented but not wired.** No "payment cleared" hook exists in the codebase. The service method ships ready for a future caller.
- **Auth on new facility endpoints** uses the existing `authenticate` JWT middleware (matches `companyController.editCompany` pattern from F-008). The spec mentioned "Company_Admin+" but the codebase doesn't have role-granular middleware; we follow the existing convention.

## File map

Files added:
- `server/services/gateProviders/GateProviderAdapter.js`
- `server/services/gateProviders/openTechAdapter.js`
- `server/services/gateService.js`
- `server/controllers/gateController.js`
- `server/tests/unit/eventGateEnum.test.js`
- `server/tests/unit/rentalGateFields.test.js`
- `server/tests/unit/gateSchemaFields.test.js`
- `server/tests/services/gateProviders/openTechAdapter.test.js`
- `server/tests/services/gateService.syncFacilityResources.test.js`
- `server/tests/services/gateService.provisionTenant.test.js`
- `server/tests/services/gateService.revokeTenant.test.js`
- `server/tests/services/gateService.suspendUnit.test.js`
- `server/tests/controllers/gateController.syncFacility.test.js`
- `server/tests/controllers/gateController.setDefaults.test.js`
- `server/tests/controllers/gateController.getStatus.test.js`
- `server/tests/controllers/gateController.retryProvision.test.js`
- `server/tests/processes/delinquency.test.js`

Files modified:
- `server/models/event.js` — add 5 enum values
- `server/models/rental.js` — add `gateProviderRefs` + `gateProvisionError`
- `server/models/company.js` — add `gateProviders.opentech.{apiKey,apiSecret}`
- `server/models/facility.js` — add `gateProvider` + `gateProviderRefs.opentech.*`
- `server/models/unit.js` — add `gateProviderRefs.opentech.unitId`
- `server/services/leaseService.js` — `applyEnvelopeEvent` calls `gateService` after state transitions
- `server/processes/delinquency.js` — call `gateService.suspendUnit` for overdue units
- `server/routes/facilityRoutes.js` — 3 new gate routes
- `server/routes/rentalRoutes.js` — 1 new gate retry route
- `server/tests/setup.js` — set OPENTECH_* + GATE_* env vars
- `server/tests/services/leaseService.applyEnvelopeEvent.test.js` — extend with gate-hook assertions
- `CLAUDE.md`, `server/CLAUDE.md` — document env vars + OpenTech setup checklist

---

## Pre-flight

- [ ] **Step P1: Baseline tests pass**

Run: `cd server && npm test`
Expected: 127/127 pass (state at end of sub-project 2).

---

## Task 1: Extend Event enum + Rental schema

**Files:**
- Modify: `server/models/event.js`, `server/models/rental.js`
- Create: `server/tests/unit/eventGateEnum.test.js`, `server/tests/unit/rentalGateFields.test.js`

- [ ] **Step 1: Write the failing Event enum test**

Create `server/tests/unit/eventGateEnum.test.js`:

```js
import { describe, it, expect } from "vitest";
import Event from "../../models/event.js";
import mongoose from "mongoose";

describe("Event schema — gate enum values", () => {
  it.each(["Gate Provisioned", "Gate Revoked", "Gate Suspended", "Gate Unsuspended", "Gate Sync"])(
    "accepts %s as a valid eventName under Integration eventType",
    async (name) => {
      const ev = await Event.create({
        eventType: "Integration",
        eventName: name,
        message: "test event",
        company: new mongoose.Types.ObjectId(),
      });
      expect(ev.eventName).toBe(name);
    }
  );
});
```

- [ ] **Step 2: Write the failing Rental schema test**

Create `server/tests/unit/rentalGateFields.test.js`:

```js
import { describe, it, expect } from "vitest";
import Rental from "../../models/rental.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Rental schema — gate fields", () => {
  it("accepts gateProviderRefs.opentech + gateProvisionError", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      gateProviderRefs: { opentech: { visitorId: "v_1", accessCode: "12345678", provisionedAt: new Date() } },
      gateProvisionError: "test error",
    });

    expect(rental.gateProviderRefs.opentech.visitorId).toBe("v_1");
    expect(rental.gateProviderRefs.opentech.accessCode).toBe("12345678");
    expect(rental.gateProviderRefs.opentech.provisionedAt).toBeInstanceOf(Date);
    expect(rental.gateProvisionError).toBe("test error");
  });
});
```

- [ ] **Step 3: Run, observe failures**

Run: `cd server && npx vitest run tests/unit/eventGateEnum.test.js tests/unit/rentalGateFields.test.js`
Expected: enum validation failures + dropped Rental fields.

- [ ] **Step 4: Apply enum extension**

In `server/models/event.js`, find the `eventName` enum array. Inside the `//Integrations` section (where `Lease Signed/Declined/Voided` were added in sub-project 2), append:

```js
        //Integrations
        "Lease Signed",
        "Lease Declined",
        "Lease Voided",
        "Gate Provisioned",
        "Gate Revoked",
        "Gate Suspended",
        "Gate Unsuspended",
        "Gate Sync",
        //Notifications
```

- [ ] **Step 5: Apply Rental schema**

In `server/models/rental.js`, add inside the schema definition (after existing fields like `signedPdfUrl`, before the closing brace of the schema first arg):

```js
    gateProviderRefs: {
      opentech: {
        visitorId: { type: String },
        accessCode: { type: String },
        provisionedAt: { type: Date },
      },
    },
    gateProvisionError: { type: String },
```

- [ ] **Step 6: Run + verify**

Run: `cd server && npx vitest run tests/unit/eventGateEnum.test.js tests/unit/rentalGateFields.test.js`
Expected: 6/6 pass.

Run: `cd server && npm test`
Expected: 133/133 pass.

- [ ] **Step 7: Commit**

```bash
git add server/models/event.js server/models/rental.js server/tests/unit/eventGateEnum.test.js server/tests/unit/rentalGateFields.test.js
git commit -m "Add Gate enum values + Rental.gateProviderRefs/gateProvisionError"
```

---

## Task 2: Extend Company / Facility / StorageUnit schemas

**Files:**
- Modify: `server/models/company.js`, `server/models/facility.js`, `server/models/unit.js`
- Create: `server/tests/unit/gateSchemaFields.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/unit/gateSchemaFields.test.js`:

```js
import { describe, it, expect } from "vitest";
import Company from "../../models/company.js";
import StorageFacility from "../../models/facility.js";
import StorageUnit from "../../models/unit.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Gate schema — Company / Facility / StorageUnit", () => {
  it("Company accepts gateProviders.opentech credentials", async () => {
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k1", apiSecret: "s1" } },
    });
    const reloaded = await Company.findById(c._id);
    expect(reloaded.gateProviders.opentech.apiKey).toBe("k1");
    expect(reloaded.gateProviders.opentech.apiSecret).toBe("s1");
  });

  it("Facility accepts gateProvider + gateProviderRefs.opentech.* including time groups + access profiles", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: {
        opentech: {
          facilityId: "f_remote",
          timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
          accessProfiles: [{ id: "ap1", name: "All Access", isDefault: true }],
          defaultTimeGroupId: "tg1",
          defaultAccessProfileId: "ap1",
          syncedAt: new Date(),
        },
      },
    });
    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProvider).toBe("opentech");
    expect(reloaded.gateProviderRefs.opentech.facilityId).toBe("f_remote");
    expect(reloaded.gateProviderRefs.opentech.timeGroups).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.defaultTimeGroupId).toBe("tg1");
  });

  it("StorageUnit accepts gateProviderRefs.opentech.unitId", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f, {
      gateProviderRefs: { opentech: { unitId: "u_remote" } },
    });
    const reloaded = await StorageUnit.findById(u._id);
    expect(reloaded.gateProviderRefs.opentech.unitId).toBe("u_remote");
  });

  it("Facility rejects an unknown gateProvider value", async () => {
    const c = await makeCompany();
    await expect(
      StorageFacility.create({
        company: c._id,
        facilityName: "X",
        status: "Enabled",
        address: { street1: "1", city: "X", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { phone: "5550100000", email: "x@example.com" },
        createdBy: c.createdBy,
        gateProvider: "bogus",
      })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/unit/gateSchemaFields.test.js`
Expected: fields dropped / invalid enum not enforced.

- [ ] **Step 3: Modify `server/models/company.js`**

Find the schema definition. Add inside it (after the existing `stripe` field):

```js
    gateProviders: {
      opentech: {
        apiKey: { type: String },
        apiSecret: { type: String },
      },
    },
```

- [ ] **Step 4: Modify `server/models/facility.js`**

Add inside the schema:

```js
    gateProvider: {
      type: String,
      enum: ["opentech"],
    },
    gateProviderRefs: {
      opentech: {
        facilityId: { type: String },
        timeGroups: [{
          id: { type: String },
          name: { type: String },
          isDefault: { type: Boolean },
        }],
        accessProfiles: [{
          id: { type: String },
          name: { type: String },
          isDefault: { type: Boolean },
        }],
        defaultTimeGroupId: { type: String },
        defaultAccessProfileId: { type: String },
        syncedAt: { type: Date },
      },
    },
```

- [ ] **Step 5: Modify `server/models/unit.js`**

Add inside the schema:

```js
    gateProviderRefs: {
      opentech: {
        unitId: { type: String },
      },
    },
```

- [ ] **Step 6: Run + verify**

Run: `cd server && npx vitest run tests/unit/gateSchemaFields.test.js`
Expected: 4/4 pass.

Run: `cd server && npm test`
Expected: 137/137 pass.

- [ ] **Step 7: Commit**

```bash
git add server/models/company.js server/models/facility.js server/models/unit.js server/tests/unit/gateSchemaFields.test.js
git commit -m "Add gateProvider config to Company/Facility/StorageUnit schemas"
```

---

## Task 3: GateProviderAdapter contract + env wiring

**Files:**
- Create: `server/services/gateProviders/GateProviderAdapter.js`
- Modify: `server/tests/setup.js`

- [ ] **Step 1: Add env defaults to test setup**

In `server/tests/setup.js`, add inside the env block:

```js
process.env.OPENTECH_CLIENT_ID = process.env.OPENTECH_CLIENT_ID || "test-client-id";
process.env.OPENTECH_CLIENT_SECRET = process.env.OPENTECH_CLIENT_SECRET || "test-client-secret";
process.env.OPENTECH_ENV = process.env.OPENTECH_ENV || "dev";
process.env.GATE_ACCESS_CODE_LENGTH = process.env.GATE_ACCESS_CODE_LENGTH || "8";
process.env.GATE_RETRY_BACKOFF_MS = process.env.GATE_RETRY_BACKOFF_MS || "10,20,40";
```

(Test backoff is intentionally tiny so 5XX retry tests don't take 7 seconds each.)

- [ ] **Step 2: Create the adapter contract**

Create `server/services/gateProviders/GateProviderAdapter.js`:

```js
/**
 * Gate provider adapter contract.
 *
 * Each concrete adapter (openTechAdapter, nokeAdapter, etc.) exports a default
 * object matching this shape. gateService dispatches to the adapter chosen by
 * Facility.gateProvider.
 *
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
 * @property {Object} facility   - StorageFacility doc (with company populated)
 * @property {Object} rental     - Rental doc
 * @property {Object} tenant     - Tenant doc
 * @property {string} accessCode - access code chosen by gateService
 *
 * @typedef {Object} GateProviderAdapter
 * @property {(input: GateProvisionInput) => Promise<{ visitorId: string }>} provisionTenant
 * @property {(input: { facility: Object, rental: Object, unit: Object }) => Promise<void>} revokeTenant
 * @property {(input: { facility: Object, unit: Object }) => Promise<void>} suspendUnit
 * @property {(input: { facility: Object, unit: Object }) => Promise<void>} unsuspendUnit
 * @property {(input: { facility: Object }) => Promise<GateTimeGroup[]>} listTimeGroups
 * @property {(input: { facility: Object }) => Promise<GateAccessProfile[]>} listAccessProfiles
 * @property {(input: { facility: Object }) => Promise<{ ok: boolean, error?: string }>} healthCheck
 */

export {};
```

(Empty export so the file is a valid ESM module; the JSDoc is the contract.)

- [ ] **Step 3: Verify the suite still passes**

Run: `cd server && npm test`
Expected: 137/137 (no behavior change).

- [ ] **Step 4: Commit**

```bash
git add server/services/gateProviders/GateProviderAdapter.js server/tests/setup.js
git commit -m "Add GateProviderAdapter contract (JSDoc) + test-env defaults"
```

---

## Task 4: openTechAdapter — full implementation + auth/cache tests

**Files:**
- Create: `server/services/gateProviders/openTechAdapter.js`
- Create: `server/tests/services/gateProviders/openTechAdapter.test.js`

- [ ] **Step 1: Write the failing test (auth only)**

Create `server/tests/services/gateProviders/openTechAdapter.test.js`:

```js
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.OPENTECH_CLIENT_ID = "test-client-id";
  process.env.OPENTECH_CLIENT_SECRET = "test-client-secret";
  process.env.OPENTECH_ENV = "dev";
});

afterEach(() => {
  delete global.fetch;
});

async function loadAdapter() {
  vi.resetModules();
  return (await import("../../../services/gateProviders/openTechAdapter.js")).default;
}

function makeFacility() {
  return {
    _id: "f1",
    company: {
      _id: "c1",
      gateProviders: { opentech: { apiKey: "ak", apiSecret: "as" } },
    },
    gateProviderRefs: { opentech: { facilityId: "remote_f1" } },
  };
}

describe("openTechAdapter — auth", () => {
  it("posts form-encoded grant_type=password to dev auth URL on first call", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ access_token: "tok1", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    const authCall = fetchMock.mock.calls[0];
    expect(authCall[0]).toBe("https://auth.insomniaccia-dev.com/auth/token");
    expect(authCall[1].method).toBe("POST");
    expect(authCall[1].headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = authCall[1].body;
    expect(body).toContain("grant_type=password");
    expect(body).toContain("username=ak");
    expect(body).toContain("password=as");
    expect(body).toContain("client_id=test-client-id");
    expect(body).toContain("client_secret=test-client-secret");
  });

  it("reuses cached JWT on second call within TTL", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-cache", expires_in: 60 }),
    });
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    const facility = makeFacility();
    await adapter.listTimeGroups({ facility });
    await adapter.listTimeGroups({ facility });
    await adapter.listTimeGroups({ facility });

    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(1);
  });

  it("isolates JWT cache between companies", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-A", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-B", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    const facilityA = makeFacility();
    const facilityB = { ...makeFacility(), company: { ...makeFacility().company, _id: "c2" } };

    await adapter.listTimeGroups({ facility: facilityA });
    await adapter.listTimeGroups({ facility: facilityB });

    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(2);
  });

  it("refreshes token and retries once on 401", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "old-tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "fresh-tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => [{ id: "tg1", name: "24x7", isDefault: true }],
    });

    const result = await adapter.listTimeGroups({ facility: makeFacility() });
    expect(result).toEqual([{ id: "tg1", name: "24x7", isDefault: true }]);
    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(2);
  });

  it("backs off and retries on 5XX, then succeeds", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => [{ id: "tg1", name: "24x7", isDefault: true }],
    });

    const result = await adapter.listTimeGroups({ facility: makeFacility() });
    expect(result).toHaveLength(1);
  });

  it("includes api-version: 2.0 header on Access Control calls", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    const accessCall = fetchMock.mock.calls.find((c) => c[0].includes("/facilities/"));
    expect(accessCall[1].headers["api-version"]).toBe("2.0");
    expect(accessCall[1].headers.Authorization).toMatch(/^Bearer /);
  });

  it("uses prod base URL when OPENTECH_ENV=prod", async () => {
    process.env.OPENTECH_ENV = "prod";
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    expect(fetchMock.mock.calls[0][0]).toContain("auth.insomniaccia.com");
    expect(fetchMock.mock.calls[0][0]).not.toContain("-dev");
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/gateProviders/openTechAdapter.test.js`
Expected: module not found.

- [ ] **Step 3: Create the adapter**

Create `server/services/gateProviders/openTechAdapter.js`:

```js
const tokenCache = new Map(); // companyId -> { token, expiresAt }

const BASE = (svc) => {
  const env = process.env.OPENTECH_ENV === "dev" ? "insomniaccia-dev.com" : "insomniaccia.com";
  return `https://${svc}.${env}`;
};

const AUTH_BASE = () => BASE("auth");
const ACCESS_BASE = () => BASE("accesscontrol");

async function getToken(company) {
  const companyId = String(company._id);
  const cached = tokenCache.get(companyId);
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) return cached.token;

  const body = new URLSearchParams({
    grant_type: "password",
    username: company.gateProviders?.opentech?.apiKey || "",
    password: company.gateProviders?.opentech?.apiSecret || "",
    client_id: process.env.OPENTECH_CLIENT_ID || "",
    client_secret: process.env.OPENTECH_CLIENT_SECRET || "",
  }).toString();

  const res = await fetch(`${AUTH_BASE()}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`OpenTech auth failed: ${res.status}`);
  }
  const json = await res.json();
  // Docs say expires_in is "number of minutes"
  const ttlMs = (json.expires_in || 60) * 60 * 1000;
  tokenCache.set(companyId, { token: json.access_token, expiresAt: now + ttlMs });
  return json.access_token;
}

function backoffSchedule() {
  return (process.env.GATE_RETRY_BACKOFF_MS || "1000,2000,4000")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function authedRequest(method, path, { facility, body, query } = {}) {
  const company = facility.company;
  let token = await getToken(company);
  const url = new URL(`${ACCESS_BASE()}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const baseInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "api-version": "2.0",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let attempt = 0;
  const schedule = backoffSchedule();
  while (true) {
    let res;
    try {
      res = await fetch(url.toString(), baseInit);
    } catch (netErr) {
      if (attempt >= schedule.length) throw netErr;
      await sleep(schedule[attempt]);
      attempt += 1;
      continue;
    }
    if (res.status === 401 && attempt === 0) {
      tokenCache.delete(String(company._id));
      token = await getToken(company);
      baseInit.headers.Authorization = `Bearer ${token}`;
      attempt += 1;
      continue;
    }
    if (res.status >= 500 && attempt < schedule.length) {
      await sleep(schedule[attempt]);
      attempt += 1;
      continue;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`OpenTech ${method} ${path} failed: ${res.status} ${text}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }
}

const openTechAdapter = {
  async listTimeGroups({ facility }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)");
    const items = await authedRequest("GET", `/facilities/${fid}/time-groups`, { facility });
    return (items || []).map((g) => ({ id: String(g.id), name: g.name, isDefault: !!g.isDefault }));
  },
  async listAccessProfiles({ facility }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)");
    const items = await authedRequest("GET", `/facilities/${fid}/access-profiles`, { facility });
    return (items || []).map((p) => ({ id: String(p.id), name: p.name, isDefault: !!p.isDefault }));
  },
  async healthCheck({ facility }) {
    try {
      await authedRequest("GET", "/facilities", { facility });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  async provisionTenant({ facility, rental, tenant, accessCode }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const unitId = facility?.__unitRef?.gateProviderRefs?.opentech?.unitId;
    if (!fid) throw new Error("Facility not linked to OpenTech");
    if (!unitId) throw new Error("Unit not linked to OpenTech");
    const tg = facility.gateProviderRefs?.opentech?.defaultTimeGroupId;
    const ap = facility.gateProviderRefs?.opentech?.defaultAccessProfileId;
    if (!tg || !ap) throw new Error("Gate defaults not configured");
    const body = {
      isTenant: true,
      unitId,
      accessCode,
      timeGroupId: tg,
      accessProfileId: ap,
      firstName: tenant?.firstName,
      lastName: tenant?.lastName,
      mobilePhoneNumber: tenant?.contactInfo?.phone,
    };
    const result = await authedRequest("POST", `/facilities/${fid}/visitors`, { facility, body });
    return { visitorId: String(result.id || result.visitorId || result._id) };
  },
  async revokeTenant({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    await authedRequest("POST", `/facilities/${fid}/units/${uid}/vacate`, { facility, body: {} });
  },
  async suspendUnit({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    try {
      await authedRequest("POST", `/facilities/${fid}/units/${uid}/disable`, { facility, body: {} });
    } catch (e) {
      if (e.status === 400 && /already/i.test(e.body || "")) return;
      throw e;
    }
  },
  async unsuspendUnit({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    try {
      await authedRequest("POST", `/facilities/${fid}/units/${uid}/enable`, { facility, body: {} });
    } catch (e) {
      if (e.status === 400 && /already/i.test(e.body || "")) return;
      throw e;
    }
  },
};

export default openTechAdapter;
```

- [ ] **Step 4: Run + verify**

Run: `cd server && npx vitest run tests/services/gateProviders/openTechAdapter.test.js`
Expected: 7/7 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/gateProviders/openTechAdapter.js server/tests/services/gateProviders/openTechAdapter.test.js
git commit -m "Add openTechAdapter — full implementation with auth/cache/retry/api-version"
```

---

## Task 5: gateService + 4 endpoints + sync/setDefaults tests

**Files:**
- Create: `server/services/gateService.js`
- Create: `server/controllers/gateController.js`
- Modify: `server/routes/facilityRoutes.js`, `server/routes/rentalRoutes.js`
- Create: `server/tests/services/gateService.syncFacilityResources.test.js`
- Create: `server/tests/controllers/gateController.syncFacility.test.js`
- Create: `server/tests/controllers/gateController.setDefaults.test.js`

- [ ] **Step 1: Write failing service test**

Create `server/tests/services/gateService.syncFacilityResources.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

const listTimeGroups = vi.fn();
const listAccessProfiles = vi.fn();

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups,
    listAccessProfiles,
    provisionTenant: vi.fn(),
    revokeTenant: vi.fn(),
    suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(),
    healthCheck: vi.fn(),
  },
}));

import { syncFacilityResources } from "../../services/gateService.js";

beforeEach(() => {
  listTimeGroups.mockReset();
  listAccessProfiles.mockReset();
});

describe("gateService.syncFacilityResources", () => {
  it("returns noop when facility has no gateProvider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const result = await syncFacilityResources({ facilityId: f._id });
    expect(result).toEqual({ noop: true, reason: "no-provider" });
    expect(listTimeGroups).not.toHaveBeenCalled();
  });

  it("populates timeGroups + accessProfiles + syncedAt on the Facility doc", async () => {
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } },
    });
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: { opentech: { facilityId: "remote_f" } },
    });

    listTimeGroups.mockResolvedValue([{ id: "tg1", name: "24x7", isDefault: true }]);
    listAccessProfiles.mockResolvedValue([{ id: "ap1", name: "All", isDefault: true }]);

    const result = await syncFacilityResources({ facilityId: f._id });
    expect(result.noop).toBe(false);

    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProviderRefs.opentech.timeGroups).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.timeGroups[0].id).toBe("tg1");
    expect(reloaded.gateProviderRefs.opentech.accessProfiles).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.syncedAt).toBeInstanceOf(Date);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/gateService.syncFacilityResources.test.js`
Expected: module not found.

- [ ] **Step 3: Create gateService**

Create `server/services/gateService.js`:

```js
import crypto from "crypto";
import StorageFacility from "../models/facility.js";
import StorageUnit from "../models/unit.js";
import Rental from "../models/rental.js";
import Event from "../models/event.js";
import openTechAdapter from "./gateProviders/openTechAdapter.js";

const adapters = { opentech: openTechAdapter };

function pickAdapter(facility) {
  const key = facility?.gateProvider;
  return key ? adapters[key] : null;
}

async function logEvent(eventName, facility, message) {
  await Event.create({
    eventType: "Integration",
    eventName,
    company: facility.company?._id || facility.company,
    facility: facility._id,
    message,
  });
}

async function loadFacilityWithCompany(facilityId) {
  return StorageFacility.findById(facilityId).populate("company");
}

export async function syncFacilityResources({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const [tgs, aps] = await Promise.all([
    adapter.listTimeGroups({ facility }),
    adapter.listAccessProfiles({ facility }),
  ]);
  facility.gateProviderRefs = facility.gateProviderRefs || {};
  facility.gateProviderRefs[facility.gateProvider] = facility.gateProviderRefs[facility.gateProvider] || {};
  const refs = facility.gateProviderRefs[facility.gateProvider];
  refs.timeGroups = tgs;
  refs.accessProfiles = aps;
  refs.syncedAt = new Date();
  facility.markModified("gateProviderRefs");
  await facility.save();

  await logEvent("Gate Sync", facility, `Synced ${tgs.length} time groups + ${aps.length} access profiles`);

  return { noop: false, timeGroups: tgs.length, accessProfiles: aps.length };
}

export async function setDefaults({ facilityId, defaultTimeGroupId, defaultAccessProfileId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const refs = facility.gateProviderRefs?.[facility.gateProvider];
  if (!refs?.timeGroups?.length || !refs?.accessProfiles?.length) {
    throw new Error("Time group / access profile not in synced list — run /sync first");
  }
  if (!refs.timeGroups.find((g) => g.id === defaultTimeGroupId)) {
    throw new Error("Time group / access profile not in synced list — run /sync first");
  }
  if (!refs.accessProfiles.find((p) => p.id === defaultAccessProfileId)) {
    throw new Error("Time group / access profile not in synced list — run /sync first");
  }

  refs.defaultTimeGroupId = defaultTimeGroupId;
  refs.defaultAccessProfileId = defaultAccessProfileId;
  facility.markModified("gateProviderRefs");
  await facility.save();
  return { noop: false };
}

export async function getStatus({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { adapterHealthy: null, lastSyncedAt: null, unprovisionedRentalCount: 0, provider: null };

  const health = await adapter.healthCheck({ facility });
  const unprovisionedRentalCount = await Rental.countDocuments({
    facility: facility._id,
    signingStatus: "signed",
    $or: [
      { [`gateProviderRefs.${facility.gateProvider}.visitorId`]: { $exists: false } },
      { [`gateProviderRefs.${facility.gateProvider}.visitorId`]: null },
    ],
  });
  return {
    provider: facility.gateProvider,
    adapterHealthy: health.ok,
    adapterError: health.error,
    lastSyncedAt: facility.gateProviderRefs?.[facility.gateProvider]?.syncedAt || null,
    unprovisionedRentalCount,
  };
}

function generateAccessCode() {
  const len = Number(process.env.GATE_ACCESS_CODE_LENGTH || 8);
  const min = 10 ** (len - 1);
  const range = 9 * min;
  return String(min + crypto.randomInt(range));
}

export async function provisionTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId).populate("tenant");
  if (!rental) throw new Error("Rental not found");

  const facility = await loadFacilityWithCompany(rental.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const providerKey = facility.gateProvider;
  if (rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "already-provisioned" };
  }

  const unit = await StorageUnit.findById(rental.unit);
  if (!unit) throw new Error("Unit not found");
  facility.__unitRef = unit;

  let accessCode = generateAccessCode();
  let result;
  try {
    result = await adapter.provisionTenant({ facility, rental, tenant: rental.tenant, accessCode });
  } catch (e) {
    if (e.status === 400 && /access.code|duplicate/i.test(e.body || e.message || "")) {
      accessCode = generateAccessCode();
      result = await adapter.provisionTenant({ facility, rental, tenant: rental.tenant, accessCode });
    } else {
      throw e;
    }
  }

  rental.gateProviderRefs = rental.gateProviderRefs || {};
  rental.gateProviderRefs[providerKey] = {
    visitorId: result.visitorId,
    accessCode,
    provisionedAt: new Date(),
  };
  rental.gateProvisionError = undefined;
  rental.markModified("gateProviderRefs");
  await rental.save();

  await logEvent("Gate Provisioned", facility, `Visitor ${result.visitorId} for rental ${rental._id}`);
  return { noop: false, visitorId: result.visitorId, accessCode };
}

export async function revokeTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw new Error("Rental not found");
  const facility = await loadFacilityWithCompany(rental.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const providerKey = facility.gateProvider;
  if (!rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "no-visitor" };
  }
  const unit = await StorageUnit.findById(rental.unit);
  if (!unit) throw new Error("Unit not found");

  await adapter.revokeTenant({ facility, rental, unit });

  rental.gateProviderRefs[providerKey].visitorId = undefined;
  rental.markModified("gateProviderRefs");
  await rental.save();

  await logEvent("Gate Revoked", facility, `Vacated unit ${unit._id} for rental ${rental._id}`);
  return { noop: false };
}

export async function suspendUnit({ unitId }) {
  const unit = await StorageUnit.findById(unitId);
  if (!unit) throw new Error("Unit not found");
  const facility = await loadFacilityWithCompany(unit.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  await adapter.suspendUnit({ facility, unit });
  await logEvent("Gate Suspended", facility, `Suspended unit ${unit._id}`);
  return { noop: false };
}

export async function unsuspendUnit({ unitId }) {
  const unit = await StorageUnit.findById(unitId);
  if (!unit) throw new Error("Unit not found");
  const facility = await loadFacilityWithCompany(unit.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  await adapter.unsuspendUnit({ facility, unit });
  await logEvent("Gate Unsuspended", facility, `Unsuspended unit ${unit._id}`);
  return { noop: false };
}

export async function retryProvisionTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw new Error("Rental not found");
  const facility = await loadFacilityWithCompany(rental.facility);
  const providerKey = facility?.gateProvider;
  if (providerKey && rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "already-provisioned" };
  }
  return provisionTenant({ rentalId });
}
```

- [ ] **Step 4: Run sync service test**

Run: `cd server && npx vitest run tests/services/gateService.syncFacilityResources.test.js`
Expected: 2/2 pass.

- [ ] **Step 5: Write failing controller tests**

Create `server/tests/controllers/gateController.syncFacility.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: vi.fn(),
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { syncFacilityResources } from "../../services/gateService.js";

let app, cookie;
beforeEach(async () => {
  syncFacilityResources.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /facilities/:facilityId/gate/sync", () => {
  it("200 with counts on happy path", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    syncFacilityResources.mockResolvedValue({ noop: false, timeGroups: 3, accessProfiles: 2 });

    const res = await api(app).post(`/facilities/${f._id}/gate/sync`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ timeGroups: 3, accessProfiles: 2 });
    expect(syncFacilityResources).toHaveBeenCalledWith({ facilityId: f._id.toString() });
  });

  it("502 when adapter auth fails", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    syncFacilityResources.mockRejectedValue(new Error("OpenTech auth failed: 400"));

    const res = await api(app).post(`/facilities/${f._id}/gate/sync`).set("Cookie", cookie);
    expect(res.status).toBe(502);
  });
});
```

Create `server/tests/controllers/gateController.setDefaults.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: vi.fn(),
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { setDefaults } from "../../services/gateService.js";

let app, cookie;
beforeEach(async () => {
  setDefaults.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("PUT /facilities/:facilityId/gate/defaults", () => {
  it("200 on happy path", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    setDefaults.mockResolvedValue({ noop: false });

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/defaults`)
      .set("Cookie", cookie)
      .send({ defaultTimeGroupId: "tg1", defaultAccessProfileId: "ap1" });

    expect(res.status).toBe(200);
  });

  it("400 when service rejects unknown IDs", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    setDefaults.mockRejectedValue(new Error("Time group / access profile not in synced list — run /sync first"));

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/defaults`)
      .set("Cookie", cookie)
      .send({ defaultTimeGroupId: "bogus", defaultAccessProfileId: "bogus" });

    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 6: Run, observe failures**

Run: `cd server && npx vitest run tests/controllers/gateController.syncFacility.test.js tests/controllers/gateController.setDefaults.test.js`
Expected: 404s.

- [ ] **Step 7: Create the controller**

Create `server/controllers/gateController.js`:

```js
import * as gateService from "../services/gateService.js";

export const syncFacility = async (req, res) => {
  try {
    const result = await gateService.syncFacilityResources({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/OpenTech (auth|credentials)/i.test(msg)) return res.status(502).json({ message: msg });
    if (/Facility not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/sync failed:", msg);
    return res.status(502).json({ message: "Gate sync failed" });
  }
};

export const setDefaults = async (req, res) => {
  try {
    const result = await gateService.setDefaults({
      facilityId: req.params.facilityId,
      defaultTimeGroupId: req.body?.defaultTimeGroupId,
      defaultAccessProfileId: req.body?.defaultAccessProfileId,
    });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/synced list/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/defaults failed:", msg);
    return res.status(500).json({ message: "Failed to update gate defaults" });
  }
};

export const getStatus = async (req, res) => {
  try {
    const result = await gateService.getStatus({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    return res.status(500).json({ message: "Failed to fetch gate status" });
  }
};

export const retryProvision = async (req, res) => {
  try {
    const result = await gateService.retryProvisionTenant({ rentalId: req.params.rentalId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Rental not found") return res.status(404).json({ message: msg });
    console.error("gate/retry failed:", msg);
    return res.status(502).json({ message: "Gate retry failed" });
  }
};
```

- [ ] **Step 8: Register routes**

In `server/routes/facilityRoutes.js`, add the import alongside existing imports:

```js
import * as gateController from "../controllers/gateController.js";
```

Find an appropriate spot among the existing routes (after other facility routes, before the export) and add:

```js
router.post("/:facilityId/gate/sync", authenticate, gateController.syncFacility);
router.put("/:facilityId/gate/defaults", authenticate, gateController.setDefaults);
router.get("/:facilityId/gate/status", authenticate, gateController.getStatus);
```

(The existing `authenticate` middleware name and import style should already be in the file. If facilityRoutes.js uses a different name or default import, match what's there.)

In `server/routes/rentalRoutes.js`, add the import alongside existing imports:

```js
import * as gateController from "../controllers/gateController.js";
```

Add this route immediately after the existing `/:rentalId/lease/*` routes:

```js
router.post("/:rentalId/gate/retry", authenticateAPIKey, gateController.retryProvision);
```

- [ ] **Step 9: Run controller tests**

Run: `cd server && npx vitest run tests/controllers/gateController.syncFacility.test.js tests/controllers/gateController.setDefaults.test.js`
Expected: 4/4 pass.

- [ ] **Step 10: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 11: Commit**

```bash
git add server/services/gateService.js server/controllers/gateController.js server/routes/facilityRoutes.js server/routes/rentalRoutes.js server/tests/services/gateService.syncFacilityResources.test.js server/tests/controllers/gateController.syncFacility.test.js server/tests/controllers/gateController.setDefaults.test.js
git commit -m "Add gateService + gateController + 4 gate endpoints"
```

---

## Task 6: gateService.provisionTenant tests + retry endpoint test + status test

**Files:**
- Create: `server/tests/services/gateService.provisionTenant.test.js`
- Create: `server/tests/controllers/gateController.retryProvision.test.js`
- Create: `server/tests/controllers/gateController.getStatus.test.js`

(Service impl is already in place from Task 5's gateService.js. This task validates it.)

- [ ] **Step 1: Write the failing service test**

Create `server/tests/services/gateService.provisionTenant.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

const provisionTenantMock = vi.fn();

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(),
    listAccessProfiles: vi.fn(),
    provisionTenant: provisionTenantMock,
    revokeTenant: vi.fn(),
    suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(),
    healthCheck: vi.fn(),
  },
}));

import { provisionTenant } from "../../services/gateService.js";

beforeEach(() => provisionTenantMock.mockReset());

async function seedRental(opts = {}) {
  const company = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const facility = await makeFacility(company, {
    gateProvider: opts.facilityProvider ?? "opentech",
    gateProviderRefs: {
      opentech: {
        facilityId: "remote_f",
        timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
        accessProfiles: [{ id: "ap1", name: "All", isDefault: true }],
        defaultTimeGroupId: "tg1",
        defaultAccessProfileId: "ap1",
        syncedAt: new Date(),
      },
    },
  });
  const unit = await makeUnit(facility, {
    gateProviderRefs: { opentech: { unitId: "remote_u" } },
  });
  const tenant = await makeTenant({ company: company._id });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 100,
    status: "paid",
    signingStatus: "signed",
    ...(opts.rental || {}),
  });
  return { rental, tenant, facility, unit, company };
}

describe("gateService.provisionTenant", () => {
  it("no-op when facility has no gate provider", async () => {
    const { rental } = await seedRental({ facilityProvider: undefined });
    const result = await provisionTenant({ rentalId: rental._id });
    expect(result.noop).toBe(true);
    expect(provisionTenantMock).not.toHaveBeenCalled();
  });

  it("happy path: calls adapter, persists visitorId/accessCode/provisionedAt, writes Event", async () => {
    const { rental } = await seedRental();
    provisionTenantMock.mockResolvedValue({ visitorId: "v_remote" });

    const result = await provisionTenant({ rentalId: rental._id });

    expect(result.noop).toBe(false);
    expect(result.visitorId).toBe("v_remote");
    expect(result.accessCode).toMatch(/^\d{8}$/);

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.gateProviderRefs.opentech.visitorId).toBe("v_remote");
    expect(refreshed.gateProviderRefs.opentech.accessCode).toMatch(/^\d{8}$/);
    expect(refreshed.gateProviderRefs.opentech.provisionedAt).toBeInstanceOf(Date);

    expect(await Event.countDocuments({ eventName: "Gate Provisioned" })).toBe(1);
  });

  it("idempotent: skips when visitorId already set", async () => {
    const { rental } = await seedRental({
      rental: {
        gateProviderRefs: { opentech: { visitorId: "existing", accessCode: "11111111", provisionedAt: new Date() } },
      },
    });
    const result = await provisionTenant({ rentalId: rental._id });
    expect(result).toEqual({ noop: true, reason: "already-provisioned" });
    expect(provisionTenantMock).not.toHaveBeenCalled();
  });

  it("retries once with a new code on 400 duplicate-access-code", async () => {
    const { rental } = await seedRental();
    provisionTenantMock
      .mockRejectedValueOnce(Object.assign(new Error("duplicate access code"), { status: 400, body: "duplicate" }))
      .mockResolvedValueOnce({ visitorId: "v_retry" });

    const result = await provisionTenant({ rentalId: rental._id });
    expect(result.visitorId).toBe("v_retry");
    expect(provisionTenantMock).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run + verify**

Run: `cd server && npx vitest run tests/services/gateService.provisionTenant.test.js`
Expected: 4/4 pass (service impl already in place).

- [ ] **Step 3: Write retry-endpoint test**

Create `server/tests/controllers/gateController.retryProvision.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(), getStatus: vi.fn(),
  provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: vi.fn(), unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { retryProvisionTenant } from "../../services/gateService.js";

let app;
beforeEach(() => {
  retryProvisionTenant.mockReset();
  app = buildApp();
});

describe("POST /rental/:rentalId/gate/retry", () => {
  it("200 + result on happy path", async () => {
    retryProvisionTenant.mockResolvedValue({ noop: false, visitorId: "v_retry", accessCode: "12345678" });
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(200);
    expect(res.body.visitorId).toBe("v_retry");
  });

  it("404 when rental not found", async () => {
    retryProvisionTenant.mockRejectedValue(new Error("Rental not found"));
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(404);
  });

  it("502 on adapter failure", async () => {
    retryProvisionTenant.mockRejectedValue(new Error("OpenTech 500 boom"));
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 4: Write the status-endpoint test**

Create `server/tests/controllers/gateController.getStatus.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(),
  getStatus: vi.fn(),
  provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: vi.fn(), unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { getStatus } from "../../services/gateService.js";

let app, cookie;
beforeEach(async () => {
  getStatus.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /facilities/:facilityId/gate/status", () => {
  it("returns the status shape", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    getStatus.mockResolvedValue({
      provider: "opentech",
      adapterHealthy: true,
      lastSyncedAt: new Date("2026-05-14"),
      unprovisionedRentalCount: 2,
    });

    const res = await api(app).get(`/facilities/${f._id}/gate/status`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.adapterHealthy).toBe(true);
    expect(res.body.unprovisionedRentalCount).toBe(2);
  });
});
```

- [ ] **Step 5: Run + verify**

Run: `cd server && npx vitest run tests/services/gateService.provisionTenant.test.js tests/controllers/gateController.retryProvision.test.js tests/controllers/gateController.getStatus.test.js`
Expected: 8/8 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/tests/services/gateService.provisionTenant.test.js server/tests/controllers/gateController.retryProvision.test.js server/tests/controllers/gateController.getStatus.test.js
git commit -m "Add tests for gateService.provisionTenant + retry/status endpoints"
```

---

## Task 7: gateService.revokeTenant + suspend/unsuspend tests

**Files:**
- Create: `server/tests/services/gateService.revokeTenant.test.js`
- Create: `server/tests/services/gateService.suspendUnit.test.js`

(Service impl is in place from Task 5.)

- [ ] **Step 1: Write the failing revoke test**

Create `server/tests/services/gateService.revokeTenant.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

const revokeTenantMock = vi.fn();

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(),
    provisionTenant: vi.fn(),
    revokeTenant: revokeTenantMock,
    suspendUnit: vi.fn(), unsuspendUnit: vi.fn(), healthCheck: vi.fn(),
  },
}));

import { revokeTenant } from "../../services/gateService.js";

beforeEach(() => revokeTenantMock.mockReset());

async function seed(rentalOverrides = {}) {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  const u = await makeUnit(f, { gateProviderRefs: { opentech: { unitId: "remote_u" } } });
  const t = await makeTenant({ company: c._id });
  const rental = await Rental.create({
    company: c._id, facility: f._id, unit: u._id, tenant: t._id,
    amount: 100, status: "paid", signingStatus: "voided",
    gateProviderRefs: { opentech: { visitorId: "v_existing", accessCode: "12345678", provisionedAt: new Date() } },
    ...rentalOverrides,
  });
  return { rental, facility: f, unit: u };
}

describe("gateService.revokeTenant", () => {
  it("calls adapter and clears visitorId, writes Event", async () => {
    const { rental } = await seed();
    revokeTenantMock.mockResolvedValue();

    const result = await revokeTenant({ rentalId: rental._id });

    expect(result.noop).toBe(false);
    expect(revokeTenantMock).toHaveBeenCalledTimes(1);
    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.gateProviderRefs.opentech.visitorId).toBeFalsy();
    expect(await Event.countDocuments({ eventName: "Gate Revoked" })).toBe(1);
  });

  it("no-op when visitorId is unset", async () => {
    const { rental } = await seed({ gateProviderRefs: {} });
    const result = await revokeTenant({ rentalId: rental._id });
    expect(result).toEqual({ noop: true, reason: "no-visitor" });
    expect(revokeTenantMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write the failing suspend test**

Create `server/tests/services/gateService.suspendUnit.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import Event from "../../models/event.js";

const suspendUnitMock = vi.fn();
const unsuspendUnitMock = vi.fn();

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(),
    suspendUnit: suspendUnitMock, unsuspendUnit: unsuspendUnitMock, healthCheck: vi.fn(),
  },
}));

import { suspendUnit, unsuspendUnit } from "../../services/gateService.js";

beforeEach(() => {
  suspendUnitMock.mockReset();
  unsuspendUnitMock.mockReset();
});

async function seedUnit() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return makeUnit(f, { gateProviderRefs: { opentech: { unitId: "remote_u" } } });
}

describe("gateService.suspendUnit / unsuspendUnit", () => {
  it("suspend calls adapter and writes Event", async () => {
    const u = await seedUnit();
    suspendUnitMock.mockResolvedValue();
    const result = await suspendUnit({ unitId: u._id });
    expect(result.noop).toBe(false);
    expect(suspendUnitMock).toHaveBeenCalledTimes(1);
    expect(await Event.countDocuments({ eventName: "Gate Suspended" })).toBe(1);
  });

  it("unsuspend calls adapter and writes Event", async () => {
    const u = await seedUnit();
    unsuspendUnitMock.mockResolvedValue();
    const result = await unsuspendUnit({ unitId: u._id });
    expect(result.noop).toBe(false);
    expect(unsuspendUnitMock).toHaveBeenCalledTimes(1);
    expect(await Event.countDocuments({ eventName: "Gate Unsuspended" })).toBe(1);
  });

  it("no-op when facility has no provider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const result = await suspendUnit({ unitId: u._id });
    expect(result.noop).toBe(true);
    expect(suspendUnitMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run + verify**

Run: `cd server && npx vitest run tests/services/gateService.revokeTenant.test.js tests/services/gateService.suspendUnit.test.js`
Expected: 5/5 pass.

- [ ] **Step 4: Commit**

```bash
git add server/tests/services/gateService.revokeTenant.test.js server/tests/services/gateService.suspendUnit.test.js
git commit -m "Add tests for gateService.revokeTenant + suspend/unsuspend"
```

---

## Task 8: Hook into applyEnvelopeEvent

**Files:**
- Modify: `server/services/leaseService.js`
- Modify: `server/tests/services/leaseService.applyEnvelopeEvent.test.js`

- [ ] **Step 1: Append failing tests to the existing applyEnvelopeEvent test file**

Append these inside the existing `describe("leaseService.applyEnvelopeEvent", ...)` block in `server/tests/services/leaseService.applyEnvelopeEvent.test.js`:

```js
  it("on completed: also calls gateService.provisionTenant", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "provisionTenant").mockResolvedValue({ noop: false, visitorId: "v" });

    await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(spy).toHaveBeenCalledWith({ rentalId: rental._id });
    spy.mockRestore();
  });

  it("on completed: gate provisioning failure does not block the envelope transition; persists gateProvisionError", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "provisionTenant").mockRejectedValue(new Error("OpenTech down"));

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result.signingStatus).toBe("signed");
    const Rental = (await import("../../models/rental.js")).default;
    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.signingStatus).toBe("signed");
    expect(refreshed.gateProvisionError).toMatch(/OpenTech down/);
    spy.mockRestore();
  });

  it("on declined: calls gateService.revokeTenant", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "revokeTenant").mockResolvedValue({ noop: false });

    await applyEnvelopeEvent({ envelopeId: "env_abc", status: "declined" });

    expect(spy).toHaveBeenCalledWith({ rentalId: rental._id });
    spy.mockRestore();
  });
```

- [ ] **Step 2: Run, observe failures**

Run: `cd server && npx vitest run tests/services/leaseService.applyEnvelopeEvent.test.js`
Expected: 3 new failures (gateService not called yet).

- [ ] **Step 3: Wire the hook in leaseService.applyEnvelopeEvent**

In `server/services/leaseService.js`, add an import at the top alongside existing imports:

```js
import * as gateService from "./gateService.js";
```

Inside `applyEnvelopeEvent`, AFTER the existing `await Event.create({...})` call (which writes the Lease Signed/Declined/Voided audit row) and BEFORE the `return { noop: false, signingStatus: mapped };` statement, add:

```js
  // Gate provider hook. Failures here must not block the envelope state transition.
  try {
    if (mapped === "signed") {
      await gateService.provisionTenant({ rentalId: rental._id });
    } else if (mapped === "declined" || mapped === "voided") {
      await gateService.revokeTenant({ rentalId: rental._id });
    }
  } catch (gateErr) {
    rental.gateProvisionError = gateErr?.message || "Gate provisioning failed";
    try {
      await rental.save();
    } catch (saveErr) {
      console.error("Failed to persist gateProvisionError:", saveErr.message);
    }
    console.error(`Gate hook failed for envelope ${envelopeId} → ${mapped}:`, gateErr.message);
  }
```

- [ ] **Step 4: Run + verify**

Run: `cd server && npx vitest run tests/services/leaseService.applyEnvelopeEvent.test.js`
Expected: original 6 tests + 3 new = 9/9 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/leaseService.js server/tests/services/leaseService.applyEnvelopeEvent.test.js
git commit -m "Hook gateService.provisionTenant/revokeTenant into applyEnvelopeEvent"
```

---

## Task 9: Hook into delinquency.js

**Files:**
- Modify: `server/processes/delinquency.js`
- Create: `server/tests/processes/delinquency.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/processes/delinquency.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";
import StorageUnit from "../../models/unit.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(), getStatus: vi.fn(),
  provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: vi.fn(), unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { suspendUnit } from "../../services/gateService.js";
import { updateTenantStatus } from "../../processes/delinquency.js";

const TEN_DAYS_AGO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  suspendUnit.mockReset();
  suspendUnit.mockResolvedValue({ noop: false });
});

describe("delinquency.updateTenantStatus — gate suspension hook", () => {
  it("calls gateService.suspendUnit for each overdue unit; one tenant flagged delinquent", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    await StorageUnit.collection.updateOne(
      { _id: u._id },
      { $set: { paymentDate: TEN_DAYS_AGO } }
    );

    const t = await makeTenant({ company: c._id });
    await Tenant.collection.updateOne({ _id: t._id }, { $set: { status: "Rented", units: [u._id] } });

    await updateTenantStatus({ disconnect: false });

    expect(suspendUnit).toHaveBeenCalledTimes(1);
    expect(suspendUnit).toHaveBeenCalledWith({ unitId: u._id });
  });

  it("per-tenant gate failures do not abort the batch", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const u1 = await makeUnit(f);
    const u2 = await makeUnit(f);
    await StorageUnit.collection.updateOne({ _id: u1._id }, { $set: { paymentDate: TEN_DAYS_AGO } });
    await StorageUnit.collection.updateOne({ _id: u2._id }, { $set: { paymentDate: TEN_DAYS_AGO } });

    const t1 = await makeTenant({ company: c._id });
    const t2 = await makeTenant({ company: c._id });
    await Tenant.collection.updateOne({ _id: t1._id }, { $set: { status: "Rented", units: [u1._id] } });
    await Tenant.collection.updateOne({ _id: t2._id }, { $set: { status: "Rented", units: [u2._id] } });

    suspendUnit
      .mockRejectedValueOnce(new Error("OpenTech down"))
      .mockResolvedValueOnce({ noop: false });

    await updateTenantStatus({ disconnect: false });

    expect(suspendUnit).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run, observe failures**

Run: `cd server && npx vitest run tests/processes/delinquency.test.js`
Expected: `suspendUnit` not called.

- [ ] **Step 3: Add the hook in delinquency.js**

In `server/processes/delinquency.js`, add an import at the top:

```js
import * as gateService from "../services/gateService.js";
```

Inside the existing `for (const unit of tenant.units)` loop, INSIDE the existing `if (new Date(unit.paymentDate) < oneWeekAgo) { ... }` block, just AFTER `hasOverdueUnit = true;` (and BEFORE the `break;`), add:

```js
          try {
            await gateService.suspendUnit({ unitId: unit._id });
          } catch (gateErr) {
            console.error(`Gate suspend failed for unit ${unit._id}:`, gateErr.message);
          }
```

(Per-unit try/catch isolates failures so one bad unit doesn't abort the batch.)

- [ ] **Step 4: Run + verify**

Run: `cd server && npx vitest run tests/processes/delinquency.test.js`
Expected: 2/2 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add server/processes/delinquency.js server/tests/processes/delinquency.test.js
git commit -m "Hook gateService.suspendUnit into delinquency.js for overdue units"
```

---

## Task 10: Document env vars + OpenTech setup checklist

**Files:**
- Modify: `CLAUDE.md` (root), `server/CLAUDE.md`

- [ ] **Step 1: Update root `CLAUDE.md`**

In the "Required env vars" section, append these bullets after the DocuSign-related lines:

```
- Gate provider (OpenTech): `OPENTECH_CLIENT_ID`, `OPENTECH_CLIENT_SECRET`, `OPENTECH_ENV` (prod|dev, default prod)
- Gate access: `GATE_ACCESS_CODE_LENGTH` (default 8), `GATE_RETRY_BACKOFF_MS` (default "1000,2000,4000")
```

- [ ] **Step 2: Update `server/CLAUDE.md`**

In the "Env vars" section, append the same items to the listed vars. Below the existing DocuSign and Orphan-cleanup sections, append:

```markdown
### Gate provider (OpenTech)

This codebase supports multiple gate vendors via a `GateProviderAdapter` interface. OpenTech is the first implementation.

**Env vars:**

- `OPENTECH_CLIENT_ID` / `OPENTECH_CLIENT_SECRET` — per-application credentials issued by OpenTech STC Administrators. Shared across all React-PMS companies.
- `OPENTECH_ENV` — `"prod"` (default) or `"dev"`. Swaps the API base hosts: `*.insomniaccia.com` ↔ `*.insomniaccia-dev.com`.
- `GATE_ACCESS_CODE_LENGTH` — number of digits in tenant access codes (default 8 → 100M combinations).
- `GATE_RETRY_BACKOFF_MS` — comma-separated millisecond delays for 5XX retry. Default `"1000,2000,4000"`.

**Per-Company setup (one-time, per OpenTech account):**

1. OpenTech STC Administrators issue API Key + API Secret for the company's account.
2. Operator (or admin script) sets `Company.gateProviders.opentech = { apiKey, apiSecret }` in Mongo.

**Per-Facility setup:**

1. Set `Facility.gateProvider = "opentech"` and `Facility.gateProviderRefs.opentech.facilityId = "<OpenTech-side facility id>"`.
2. POST `/facilities/:facilityId/gate/sync` (JWT auth) — pulls Time Groups + Access Profiles into the Facility doc.
3. PUT `/facilities/:facilityId/gate/defaults` with `{ defaultTimeGroupId, defaultAccessProfileId }`.
4. GET `/facilities/:facilityId/gate/status` to verify `adapterHealthy: true`.

**Per-Unit setup:**

Set `StorageUnit.gateProviderRefs.opentech.unitId = "<OpenTech-side unit id>"` on every unit that should be controlled by the gate.

**Operational notes:**

- Provisioning is triggered automatically by the DocuSign webhook when a lease is signed. Failures are captured in `Rental.gateProvisionError` and visible via `GET /facilities/:facilityId/gate/status` (unprovisioned-rental count). Use `POST /rental/:rentalId/gate/retry` for manual recovery.
- Revocation is triggered automatically when a lease is declined/voided.
- Delinquency suspension is triggered by `server/processes/delinquency.js`.
- Per-Company credentials are stored **plaintext** in Mongo. Solve at the deployment layer (MongoDB Atlas KMS, AWS KMS envelope encryption) or via a follow-up `OPENTECH_CREDS_KEY` AES-256 sub-project.
```

- [ ] **Step 3: Run full suite**

Run: `cd server && npm test`
Expected: All pass (docs only).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md server/CLAUDE.md
git commit -m "Document OpenTech gate integration env vars + setup checklist"
```

---

## Final verification

- [ ] **Step F1: Full suite + lint**

Run: `cd server && npm test && npm run lint`
Expected: All tests pass; no new lint warnings beyond the 2 pre-existing (`deleteUsersWithCompany`, `facilityId`).

- [ ] **Step F2: Confirm sub-project 2 endpoints still work**

```
cd server && npx vitest run tests/controllers/rentalController.test.js
cd server && npx vitest run tests/services/leaseService.applyEnvelopeEvent.test.js
cd server && npx vitest run tests/routes/webhookRoutes.test.js
```
Expected: all pass.

- [ ] **Step F3: Push and (after user approval) open PR**

```bash
git push
gh pr create --title "Gate integration: OpenTech adapter + pluggable framework" --body "$(cat <<'EOF'
## Summary
First gate-vendor integration with React-PMS. OpenTech IoE is the first implementation; the `GateProviderAdapter` interface lets Nokē/PTI/Brivo land later without rewriting orchestration.

- New `GateProviderAdapter` JSDoc contract + `openTechAdapter` against `*.insomniaccia.com` (auth, 401 refresh, 5XX backoff, env switching).
- New `gateService` orchestrator: `provisionTenant`, `revokeTenant`, `suspendUnit`, `unsuspendUnit`, `syncFacilityResources`, `setDefaults`, `getStatus`, `retryProvisionTenant`.
- New `gateController` + 4 endpoints: `POST/PUT/GET /facilities/:id/gate/{sync,defaults,status}` + `POST /rental/:rentalId/gate/retry`.
- Hooked into `applyEnvelopeEvent` (sub-project 2): signed → provision; declined/voided → revoke. Failures captured in `Rental.gateProvisionError`, don't block envelope transitions.
- Hooked into `delinquency.js`: overdue unit → suspend. Per-unit try/catch isolates failures.
- Schema additions: `Company.gateProviders.opentech.{apiKey,apiSecret}`, `Facility.gateProvider` + `gateProviderRefs.opentech.*` (timeGroups, accessProfiles, defaults, syncedAt, facilityId), `StorageUnit.gateProviderRefs.opentech.unitId`, `Rental.gateProviderRefs.opentech.{visitorId,accessCode,provisionedAt}` + `Rental.gateProvisionError`.
- 5 new `Event` enum values: Gate Provisioned/Revoked/Suspended/Unsuspended/Sync.
- 5 new env vars documented in both CLAUDE.md files.

## Locked-in decisions (per spec)
- Per-Facility vendor selection (`Facility.gateProvider`)
- Per-Company credential storage (one set per OpenTech account, multiple facilities under it)
- Server-generated 8-digit access codes
- Inline + idempotent sync model
- Time groups + access profiles pulled and controlled within React-PMS

## Spec adaptations
- `delinquency.js` has pre-existing enum bugs (queries `Tenant.status: "Rented"` not in enum); NOT fixed in this PR. Hook layers on top.
- `unsuspendUnit` exists but no caller wires it (no payment-cleared hook). Documented as a follow-up.

## Test plan
- [ ] cd server && npm test passes
- [ ] cd server && npm run lint passes
- [ ] Failing tests observed before each fix (TDD)
- [ ] openTechAdapter tests cover auth, 401 refresh, 5XX backoff, env switching, api-version header, JWT cache + cache isolation between companies
- [ ] applyEnvelopeEvent gate-hook failure does NOT block envelope-signed transition
- [ ] delinquency.js per-unit gate failures do NOT abort the batch

## Out of scope (follow-up sub-projects)
- Access Event API polling (gate-open events)
- Encrypted credentials at rest
- Tenant-facing PIN reset
- Admin UI for editing Company.gateProviders credentials
- Multi-vendor adapters (Nokē/PTI/Brivo)
- Unsuspend-on-payment hook

Spec: docs/superpowers/specs/2026-05-14-gate-integration-opentech-design.md
Plan: docs/superpowers/plans/2026-05-14-gate-integration-opentech.md
EOF
)"
```

---

## Notes for the executor

- **OpenTech credentials** are NOT in the test env. Tests mock the adapter and/or `fetch` directly. The only place that touches real OpenTech URLs is the openTechAdapter unit tests which mock `global.fetch`.
- **JWT cache is in-process** (a `Map`). Tests reset modules between cases via `vi.resetModules()` to clear it.
- **Tenant.status enum** does NOT include `"Rented"` or `"Delinquent"` — delinquency.js has pre-existing bugs that ARE NOT in scope. Tests use `Tenant.collection.updateOne` to bypass validation when seeding.
- **Idempotency contract:** provision is keyed on persisted `visitorId`. Revoke clears it. Retry endpoint refuses to re-provision when `visitorId` is set.
- **Don't widen scope:** no access-event polling, no PIN reset, no encryption-at-rest.
- **TDD discipline:** each task observes a failing test before writing code. If a test passes pre-fix, the test isn't capturing the right invariant — adjust the test until it does, then fix.
