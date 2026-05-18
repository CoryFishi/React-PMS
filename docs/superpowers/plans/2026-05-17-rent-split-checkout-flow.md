# Rental `/rent` Split — Checkout Flow Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/rental/:co/:fac/:unit/rent` and `/login&rent` create/resolve the Tenant only (no Stripe), make `/payments/unit-checkout-session` the sole checkout path bound to the real Tenant via a threaded `tenantId`.

**Architecture:** Strip `leaseService.startRental` + `successUrl/cancelUrl` + tenant-rollback from the two rental controllers; return a safe tenant DTO. Add a real-Tenant lookup branch to `createUnitCheckoutSession`. Update the client wizard to read `response.data.tenant` and pass `tenantId` into checkout. TDD throughout.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest; React 18 + Vite (plain JSX).

**Worktree:** `C:\Users\123\Desktop\Projects\React-PMS\.claude\worktrees\fix-rent-split` — branch `claude/fix-rent-split` off `origin/main` @ 5128a1a. All commands run from this worktree root unless noted.

**Spec:** `docs/superpowers/specs/2026-05-17-rent-split-checkout-flow-design.md`

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `server/controllers/rentalController.js` | rental wizard endpoints | Add `toTenantDTO`; rewrite `createTenantAndLease` + `loginTenantAndCreateLease` (tenant-only) |
| `server/controllers/paymentController.js` | Stripe checkout endpoints | `createUnitCheckoutSession`: real-Tenant lookup when `tenantId` valid; import `Tenant` |
| `client/src/components/rentalCenter/RentalCheckout.jsx` | rental wizard UI | `createTenant`/`loginTenant` read `response.data.tenant`; `handleCheckout` sends `tenantId` |
| `server/tests/controllers/rentalController.createTenantAndLease.test.js` | `/rent` tests | Rewrite to new contract |
| `server/tests/controllers/rentalController.test.js` | `/login&rent` tests | Update to new contract |
| `server/tests/controllers/paymentController.unitCheckoutSession.tenant.test.js` | tenant-binding tests | Create |

---

### Task 1: `createTenantAndLease` → tenant-only + `toTenantDTO`

**Files:**
- Modify: `server/controllers/rentalController.js`
- Test: `server/tests/controllers/rentalController.createTenantAndLease.test.js` (full rewrite)

- [ ] **Step 1: Replace the test file with the new contract**

Overwrite `server/tests/controllers/rentalController.createTenantAndLease.test.js` with:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));

import { startRental } from "../../services/leaseService.js";

let app;

beforeEach(async () => {
  startRental.mockReset();
  app = buildApp();
});

function tenantBody(overrides = {}) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    firstName: "New",
    lastName: "Tenant",
    email: `nt-${stamp}@example.com`,
    username: `nt-${stamp}`,
    password: "ValidPassword1!",
    dateOfBirth: "1990-01-01",
    phone: "5125550000",
    street1: "1 A",
    city: "B",
    state: "TX",
    zipCode: "00000",
    country: "US",
    DLNumber: "DL1234",
    DLExpire: "2030-01-01",
    DLState: "TX",
    recoveryQuestion1: "q1",
    recoveryAnswer1: "a1",
    recoveryQuestion2: "q2",
    recoveryAnswer2: "a2",
    ...overrides,
  };
}

describe("POST /rental/:cid/:fid/:uid/rent — createTenantAndLease (tenant-only)", () => {
  it("creates Tenant 'New' and returns a tenant DTO, without calling startRental", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const info = tenantBody();

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: info });

    expect(res.status).toBe(200);
    expect(res.body.tenant).toBeTruthy();
    expect(res.body.tenant._id).toBeTruthy();
    expect(res.body.tenant.email).toBe(info.email);
    expect(res.body.tenant.status).toBe("New");
    expect(startRental).not.toHaveBeenCalled();

    const tenants = await Tenant.find({ company: company._id });
    expect(tenants).toHaveLength(1);
    expect(tenants[0].status).toBe("New");
  });

  it("does not leak password or recoveryQuestions in the DTO", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: tenantBody() });

    expect(res.status).toBe(200);
    expect(res.body.tenant.password).toBeUndefined();
    expect(res.body.tenant.recoveryQuestions).toBeUndefined();
  });

  it("returns 400 when tenant email already exists", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const email = `dup-${Date.now()}@example.com`;
    await Tenant.create({
      firstName: "Existing",
      lastName: "Tenant",
      username: `existing-${Date.now()}`,
      password: "Hashed",
      dateOfBirth: "1990-01-01",
      company: company._id,
      contactInfo: { email },
      address: { street1: "1", city: "X", state: "TX", zipCode: "00000", country: "US" },
      vehicle: { DLNumber: "DL1", DLExpire: new Date("2030-01-01"), DLState: "TX" },
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: { email, password: "ValidPassword1!" } });

    expect(res.status).toBe(400);
    expect(startRental).not.toHaveBeenCalled();
  });

  it("returns 400 with a real message on invalid tenant info and persists no Tenant", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `weak-${Date.now()}@example.com`;

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: tenantBody({ email, password: "weak" }) });

    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
    const tenants = await Tenant.find({ "contactInfo.email": email });
    expect(tenants).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd server && npx vitest run tests/controllers/rentalController.createTenantAndLease.test.js`
Expected: FAIL — current handler returns `{checkoutUrl,...}` / 502, so `res.body.tenant` is undefined and `startRental` IS called.

- [ ] **Step 3: Add `toTenantDTO` and rewrite `createTenantAndLease`**

In `server/controllers/rentalController.js`, add this helper immediately after the import block (after the `import * as leaseService ...` line, before `// Get all companies`):

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

Replace the **entire** `export const createTenantAndLease = async (req, res) => { ... };` function with:

```js
export const createTenantAndLease = async (req, res) => {
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { tenantInfo } = req.body;

    if (!tenantInfo) {
      return res.status(400).json({ message: "Tenant information is required." });
    }

    const existingUser = await Tenant.findOne({
      "contactInfo.email": tenantInfo.email,
      company: companyId,
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Please Login." });
    }

    passwordValidator(tenantInfo.password);

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
      status: "Vacant",
      availability: true,
    });
    if (!unit) {
      return res.status(400).json({ message: "The selected unit is no longer available." });
    }

    const tenant = await Tenant.create({
      firstName: tenantInfo.firstName,
      middleName: tenantInfo.middleInitial,
      lastName: tenantInfo.lastName,
      dateOfBirth: tenantInfo.dateOfBirth,
      isMilitary: tenantInfo.isMilitary,
      company: companyId,
      username: tenantInfo.username,
      password: await hashPassword(tenantInfo.password),
      businessName: tenantInfo.businessName,
      status: "New",
      recoveryQuestions: [
        { question: tenantInfo.recoveryQuestion1, answer: tenantInfo.recoveryAnswer1 },
        { question: tenantInfo.recoveryQuestion2, answer: tenantInfo.recoveryAnswer2 },
      ],
      contactInfo: {
        phone: tenantInfo.phone,
        alternatePhone: tenantInfo.additionalPhone,
        email: tenantInfo.email,
      },
      address: {
        street1: tenantInfo.street1,
        street2: tenantInfo.street2,
        city: tenantInfo.city,
        state: tenantInfo.state,
        zipCode: tenantInfo.zipCode,
        country: tenantInfo.country,
      },
      vehicle: {
        DLNumber: tenantInfo.DLNumber,
        DLExpire: tenantInfo.DLExpire,
        DLState: tenantInfo.DLState,
      },
    });

    return res.status(200).json({ tenant: toTenantDTO(tenant) });
  } catch (error) {
    console.error("Error processing the createTenantAndLease call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};
```

(Note: `leaseService` is still imported and used by other handlers — do not remove the import.)

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd server && npx vitest run tests/controllers/rentalController.createTenantAndLease.test.js`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add server/controllers/rentalController.js server/tests/controllers/rentalController.createTenantAndLease.test.js
git commit -m "fix: /rent creates tenant only (no Stripe), returns tenant DTO"
```

---

### Task 2: `loginTenantAndCreateLease` → tenant-only

**Files:**
- Modify: `server/controllers/rentalController.js`
- Test: `server/tests/controllers/rentalController.test.js` (update)

- [ ] **Step 1: Replace the login test file with the new contract**

Overwrite `server/tests/controllers/rentalController.test.js` with:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import { hashPassword } from "../../helpers/password.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));

import { startRental } from "../../services/leaseService.js";

let app;
beforeEach(async () => {
  startRental.mockReset();
  app = buildApp();
});

describe("POST /rental/:cid/:fid/:uid/login&rent — tenant-only", () => {
  it("returns 200 + tenant DTO on valid creds, without calling startRental", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `tenant-${Date.now()}@example.com`;
    await makeTenant({
      company: company._id,
      contactInfo: { email },
      password: await hashPassword("ValidPassword1!"),
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ email, password: "ValidPassword1!" });

    expect(res.status).toBe(200);
    expect(res.body.tenant).toBeTruthy();
    expect(res.body.tenant._id).toBeTruthy();
    expect(res.body.tenant.email).toBe(email);
    expect(res.body.tenant.password).toBeUndefined();
    expect(startRental).not.toHaveBeenCalled();
  });

  it("returns 401 when no tenant with that email exists", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ email: "nobody@example.com", password: "anything" });

    expect(res.status).toBe(401);
    expect(startRental).not.toHaveBeenCalled();
  });

  it("returns 401 when password is wrong", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `wp-${Date.now()}@example.com`;
    await makeTenant({
      company: company._id,
      contactInfo: { email },
      password: await hashPassword("ValidPassword1!"),
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ email, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
    expect(startRental).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd server && npx vitest run tests/controllers/rentalController.test.js`
Expected: FAIL — valid-creds test: current handler returns `{checkoutUrl}` (no `res.body.tenant`) and calls `startRental`.

- [ ] **Step 3: Rewrite `loginTenantAndCreateLease`**

In `server/controllers/rentalController.js`, replace the **entire** `export const loginTenantAndCreateLease = async (req, res) => { ... };` function with:

```js
export const loginTenantAndCreateLease = async (req, res) => {
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tenant = await Tenant.findOne({
      "contactInfo.email": email,
      company: companyId,
    });
    if (!tenant) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await comparePassword(password, tenant.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
      status: "Vacant",
      availability: true,
    });
    if (!unit) {
      return res.status(400).json({ message: "The selected unit is no longer available." });
    }

    return res.status(200).json({ tenant: toTenantDTO(tenant) });
  } catch (error) {
    console.error("Error processing the loginTenantAndCreateLease call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `cd server && npx vitest run tests/controllers/rentalController.test.js`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add server/controllers/rentalController.js server/tests/controllers/rentalController.test.js
git commit -m "fix: /login&rent authenticates tenant only, returns tenant DTO"
```

---

### Task 3: `createUnitCheckoutSession` binds the real Tenant when `tenantId` is valid

**Files:**
- Modify: `server/controllers/paymentController.js`
- Test: `server/tests/controllers/paymentController.unitCheckoutSession.tenant.test.js` (create)

- [ ] **Step 1: Create the failing test**

Create `server/tests/controllers/paymentController.unitCheckoutSession.tenant.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));
vi.mock("../../services/stripeConnect.js", () => ({
  getStripeClient: vi.fn(() => ({})),
  assertStripeReadyForCompany: vi.fn(),
}));

import { startRental } from "../../services/leaseService.js";
import { assertStripeReadyForCompany } from "../../services/stripeConnect.js";
import Rental from "../../models/rental.js";

let app;
let company;
let facility;
let unit;

beforeEach(async () => {
  startRental.mockReset();
  assertStripeReadyForCompany.mockReset();
  app = buildApp();

  company = await makeCompany();
  facility = await makeFacility(company);
  unit = await makeUnit(facility);

  assertStripeReadyForCompany.mockResolvedValue({
    _id: company._id,
    stripe: { accountId: "acct_test", onboardingComplete: true },
  });

  startRental.mockImplementation(async () => {
    const rental = await Rental.create({
      company: company._id,
      facility: facility._id,
      unit: unit._id,
      tenant: undefined,
      amount: 100,
      currency: "usd",
      checkoutSessionId: `cs_${Date.now()}`,
      status: "pending",
      signingStatus: "unsent",
    });
    return { checkoutUrl: "https://stripe.example/c/x", rentalId: rental._id };
  });
});

function payload(extra = {}) {
  return {
    unitId: String(unit._id),
    tenantEmail: "shim@example.com",
    tenantName: "Shim Name",
    successUrl: "https://app.example.test/s",
    cancelUrl: "https://app.example.test/c",
    ...extra,
  };
}

describe("POST /payments/unit-checkout-session — tenant binding", () => {
  it("uses the real Tenant when a valid tenantId is provided", async () => {
    const tenant = await makeTenant({
      company: company._id,
      firstName: "Real",
      lastName: "Person",
      contactInfo: { email: "real@example.com" },
    });

    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload({ tenantId: String(tenant._id) }));

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(String(arg.tenant._id)).toBe(String(tenant._id));
    expect(arg.tenant.contactInfo.email).toBe("real@example.com");
  });

  it("falls back to the shim when tenantId is absent", async () => {
    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload());

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(arg.tenant.contactInfo.email).toBe("shim@example.com");
  });

  it("falls back to the shim when tenantId is present but not found", async () => {
    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload({ tenantId: "64b2f0000000000000000000" }));

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(arg.tenant.contactInfo.email).toBe("shim@example.com");
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `cd server && npx vitest run tests/controllers/paymentController.unitCheckoutSession.tenant.test.js`
Expected: FAIL — first test: current code uses `tenantShim` with `tenantEmail` from body, so `arg.tenant.contactInfo.email` is `"shim@example.com"`, not `"real@example.com"`.

- [ ] **Step 3: Add the `Tenant` import**

In `server/controllers/paymentController.js`, add this import immediately after `import StorageUnit from "../models/unit.js";`:

```js
import Tenant from "../models/tenant.js";
```

- [ ] **Step 4: Replace the `tenantShim` construction with a real-Tenant lookup**

In `createUnitCheckoutSession`, find this exact block:

```js
    const tenantShim = {
      _id: req.body.tenantId
        ? new mongoose.Types.ObjectId(req.body.tenantId)
        : new mongoose.Types.ObjectId(),
      firstName: tenantName || "",
      lastName: "",
      contactInfo: { email: tenantEmail || undefined },
    };
```

Replace it with:

```js
    let tenantForRental = null;
    if (req.body.tenantId && mongoose.Types.ObjectId.isValid(req.body.tenantId)) {
      const realTenant = await Tenant.findById(req.body.tenantId);
      if (realTenant) {
        tenantForRental = {
          _id: realTenant._id,
          firstName: realTenant.firstName,
          lastName: realTenant.lastName,
          contactInfo: { email: realTenant.contactInfo?.email },
        };
      }
    }
    if (!tenantForRental) {
      tenantForRental = {
        _id:
          req.body.tenantId && mongoose.Types.ObjectId.isValid(req.body.tenantId)
            ? new mongoose.Types.ObjectId(req.body.tenantId)
            : new mongoose.Types.ObjectId(),
        firstName: tenantName || "",
        lastName: "",
        contactInfo: { email: tenantEmail || undefined },
      };
    }
```

Then, in the `await leaseService.startRental({ ... })` call within the same function, change the `tenant:` argument from `tenant: tenantShim,` to:

```js
        tenant: tenantForRental,
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `cd server && npx vitest run tests/controllers/paymentController.unitCheckoutSession.tenant.test.js`
Expected: PASS (3/3).

- [ ] **Step 6: Commit**

```bash
git add server/controllers/paymentController.js server/tests/controllers/paymentController.unitCheckoutSession.tenant.test.js
git commit -m "fix: bind checkout rental to real Tenant when tenantId provided"
```

---

### Task 4: Client wizard — read `tenant` DTO and thread `tenantId`

**Files:**
- Modify: `client/src/components/rentalCenter/RentalCheckout.jsx`

(No client test suite exists — this task is a manual-verified edit. Make exactly the three changes below; do not alter other logic.)

- [ ] **Step 1: `createTenant()` reads `response.data.tenant`**

Find:

```js
      const response = await axios.post(
        `/rental/${companyId}/${facilityId}/${unitId}/rent`,
        { tenantInfo: tenantInfo },
        { headers: { "x-api-key": API_KEY } }
      );
      setTenantInfo(response.data);
      return "Tenant created successfully";
```

Replace the `setTenantInfo(response.data);` line with:

```js
      setTenantInfo(response.data.tenant);
```

- [ ] **Step 2: `loginTenant()` reads `response.data.tenant`**

Find:

```js
      const response = await axios.post(
        `/rental/${companyId}/${facilityId}/${unitId}/login&rent`,
        {
          username: data.username,
          password: data.password,
          company: companyId,
        },
        { headers: { "x-api-key": API_KEY } }
      );
      setTenantInfo(response.data);
      return "Tenant created successfully";
```

Replace the `setTenantInfo(response.data);` line with:

```js
      setTenantInfo(response.data.tenant);
```

(Leave the request body unchanged — the server reads `email`/`password`; the wizard's existing fields are out of scope for this fix.)

- [ ] **Step 3: `handleCheckout()` sends `tenantId`**

Find the `payload` object in `handleCheckout`:

```js
      const payload = {
        unitId: unit._id,
        tenantEmail: tenantInfo.email,
        tenantName:
          [tenantInfo.firstName, tenantInfo.lastName]
            .filter(Boolean)
            .join(" ") || undefined,
        successUrl: currentUrl,
        cancelUrl: currentUrl,
        metadata,
      };
```

Replace it with (adds the `tenantId` line; everything else identical):

```js
      const payload = {
        unitId: unit._id,
        tenantId: tenantInfo?._id,
        tenantEmail: tenantInfo.email,
        tenantName:
          [tenantInfo.firstName, tenantInfo.lastName]
            .filter(Boolean)
            .join(" ") || undefined,
        successUrl: currentUrl,
        cancelUrl: currentUrl,
        metadata,
      };
```

- [ ] **Step 4: Lint the client**

Run: `cd client && npm run lint`
Expected: no new errors/warnings attributable to `RentalCheckout.jsx`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/rentalCenter/RentalCheckout.jsx
git commit -m "fix: wizard reads tenant DTO and threads tenantId into checkout"
```

---

### Task 5: Full regression, lint, push, PR

**Files:** none (verification + delivery)

- [ ] **Step 1: Full server test suite**

Run: `cd server && npm test`
Expected: all suites pass, 0 failures. Confirm `leaseService.startRental.test.js`, `rentalRoutes.ordering.test.js`, and webhook tests remain green (untouched).

- [ ] **Step 2: Server lint**

Run: `cd server && npm run lint`
Expected: no new warnings in `rentalController.js` / `paymentController.js`. (Pre-existing warnings in `companyController.js`/`facilityController.js` are out of scope — do not fix them.)

- [ ] **Step 3: Push the branch**

```bash
git push -u origin claude/fix-rent-split
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --title "fix: split /rent from Stripe; bind checkout to real tenant" --body "$(cat <<'EOF'
## Summary

The Rental Center wizard's "save tenant" step (`POST /rental/.../rent`) failed with 502 because the server also tried to create a Stripe session (requiring successUrl/cancelUrl the wizard never sends) and rolled back the tenant. Payment actually happens via `/payments/unit-checkout-session`.

- `/rent` + `/login&rent` now create/resolve the Tenant only and return `{ tenant: { _id, firstName, lastName, email, phone, status } }` (no Stripe, no rollback, no leaked secrets).
- `/payments/unit-checkout-session` is the sole checkout path; when a valid `tenantId` is supplied it binds the Rental to the **real** Tenant (fixes a latent phantom-tenant bug that would have broken lease-signed gate provisioning).
- Client wizard reads `response.data.tenant` and threads `tenantId` into checkout.
- Abandoned-cart tenants (`status:"New"`, no paid rental) are reaped by the existing `orphanCleanup`.

## Test plan

- [x] `rentalController.createTenantAndLease.test.js` rewritten (tenant-only, DTO, no startRental, no secret leak)
- [x] `rentalController.test.js` updated (`/login&rent` tenant-only)
- [x] New `paymentController.unitCheckoutSession.tenant.test.js` (real tenant vs shim fallback)
- [x] Full `server` suite green; lint clean for changed files
- [ ] Post-merge: redeploy, re-run the end-to-end smoke test (wizard → pay → sign)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report the PR URL**

---

## Self-Review

**1. Spec coverage:**
- `createTenantAndLease` tenant-only + DTO → Task 1 ✓
- `loginTenantAndCreateLease` tenant-only + DTO → Task 2 ✓
- `toTenantDTO` helper (no secret leak) → Task 1 Step 3 + tests Tasks 1/2 ✓
- `createUnitCheckoutSession` real-Tenant lookup w/ `ObjectId.isValid` guard + shim fallback → Task 3 ✓
- `Tenant` import in paymentController → Task 3 Step 3 ✓
- Client `createTenant`/`loginTenant`/`handleCheckout` → Task 4 ✓
- Orphan-tenant reliance on existing cleanup → spec-documented, no code; no task needed ✓
- Tests rewrite/update/add → Tasks 1, 2, 3; regression → Task 5 ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step has full code. ✓

**3. Type consistency:** `toTenantDTO` shape `{_id,firstName,lastName,email,phone,status}` consistent across Tasks 1–2 and asserted in tests; `tenantForRental` shape `{_id,firstName,lastName,contactInfo:{email}}` matches what `startRental` consumes and Task 3 assertions; `response.data.tenant` consistent between server return and client reads. ✓

No gaps found.
