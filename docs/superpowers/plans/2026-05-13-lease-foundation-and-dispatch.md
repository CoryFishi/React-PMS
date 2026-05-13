# Lease Foundation + Envelope Dispatch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pay → Sign flow. Tenants who pay get a DocuSign embedded signing URL for a lease populated from a single org-wide template. Replaces the F-001 501-stub.

**Architecture:** Add a `server/services/leaseService.js` with two functions (`startRental`, `createEnvelope`). Extract the existing Stripe-checkout logic from `paymentController.createUnitCheckoutSession` into `startRental` so both rental endpoints and the existing payment endpoint share it. Add a `leaseController` + route for post-payment envelope creation. Extend `Rental` with lease fields; reuse the existing `Tenant.status` enum (`"New"|"Active"|"Disabled"`) — no migration needed.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest, `stripe`, `docusign-esign`. Existing helpers in `server/tests/helpers/` and the `docusignClient.js` wrapper.

**Source spec:** [docs/superpowers/specs/2026-05-13-lease-foundation-and-dispatch-design.md](../specs/2026-05-13-lease-foundation-and-dispatch-design.md)

## Spec deviations (intentional)

- **No new `Tenant.status` enum.** The model already declares `status: { enum: ["New", "Active", "Disabled"], default: "Active" }`. The plan uses `"New"` as the pending-pre-payment state and leaves `"Active"` as the post-signing state (to be set by sub-project 2). The spec's `pending|active|inactive` enum and backfill migration are **not implemented** — they would break existing data and tests for zero benefit.
- The spec's migration test (`processes/migrations/backfillTenantStatus.test.js`) is **omitted** for the same reason.

Everything else in the spec is in scope.

## File map

Files added:
- `server/services/leaseService.js` — `startRental`, `createEnvelope`
- `server/controllers/leaseController.js` — `createLeaseEnvelope`
- `server/tests/services/leaseService.startRental.test.js`
- `server/tests/services/leaseService.createEnvelope.test.js`
- `server/tests/controllers/leaseController.createLeaseEnvelope.test.js`
- `server/tests/unit/rentalLeaseFields.test.js`

Files modified:
- `server/models/rental.js` — add `tenant`, `envelopeId`, `signingStatus`, `signedAt`, `signedPdfUrl`
- `server/controllers/paymentController.js` — `createUnitCheckoutSession` becomes a thin wrapper around `leaseService.startRental`
- `server/controllers/rentalController.js` — rewrite `createTenantAndLease` (uses `leaseService.startRental`); rewrite `loginTenantAndCreateLease` (replaces F-001 stub)
- `server/routes/rentalRoutes.js` — register `POST /:rentalId/lease/envelope`
- `server/tests/controllers/rentalController.test.js` — F-001 test rewritten to assert 200 + checkoutUrl
- `CLAUDE.md`, `server/CLAUDE.md` — document `DS_LEASE_TEMPLATE_ID` env var + template tab labels
- `server/tests/setup.js` — set `DS_LEASE_TEMPLATE_ID` for tests
- `server/helpers/password.js` — add `comparePassword` if missing

---

## Pre-flight

- [ ] **Step P1: Baseline tests pass**

Run: `cd server && npm test`
Expected: 74/74 pass.

---

## Task 1: Extend Rental model

**Files:**
- Create: `server/tests/unit/rentalLeaseFields.test.js`
- Modify: `server/models/rental.js`

- [ ] **Step 1: Write the failing schema test**

Create `server/tests/unit/rentalLeaseFields.test.js`:

```js
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Rental from "../../models/rental.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Rental schema — lease fields", () => {
  it("accepts tenant, envelopeId, signingStatus, signedAt, signedPdfUrl", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const tenantId = new mongoose.Types.ObjectId();

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      tenant: tenantId,
      envelopeId: "env_abc",
      signingStatus: "sent",
      signedAt: new Date("2026-05-13"),
      signedPdfUrl: "https://example.test/lease.pdf",
    });

    expect(rental.tenant.toString()).toBe(tenantId.toString());
    expect(rental.envelopeId).toBe("env_abc");
    expect(rental.signingStatus).toBe("sent");
    expect(rental.signedAt).toEqual(new Date("2026-05-13"));
    expect(rental.signedPdfUrl).toBe("https://example.test/lease.pdf");
  });

  it("defaults signingStatus to 'unsent'", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
    });

    expect(rental.signingStatus).toBe("unsent");
  });

  it("rejects an invalid signingStatus enum value", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    await expect(
      Rental.create({
        company: c._id,
        facility: f._id,
        unit: u._id,
        amount: 100,
        signingStatus: "bogus",
      })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/unit/rentalLeaseFields.test.js`
Expected: FAIL on first assertion (fields silently dropped).

- [ ] **Step 3: Apply model changes**

Edit `server/models/rental.js`. Add these fields inside the schema definition, after the existing `metadata` field, before the closing brace of the schema's first argument:

```js
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
    },
    envelopeId: {
      type: String,
      index: true,
    },
    signingStatus: {
      type: String,
      enum: ["unsent", "sent", "signed", "declined", "voided"],
      default: "unsent",
    },
    signedAt: {
      type: Date,
    },
    signedPdfUrl: {
      type: String,
    },
```

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/unit/rentalLeaseFields.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: 77/77 pass.

- [ ] **Step 6: Commit**

```bash
git add server/models/rental.js server/tests/unit/rentalLeaseFields.test.js
git commit -m "Add lease fields to Rental model (tenant, envelopeId, signingStatus, signedAt, signedPdfUrl)"
```

---

## Task 2: DS_LEASE_TEMPLATE_ID env wiring + docs

**Files:**
- Modify: `server/tests/setup.js`, `CLAUDE.md`, `server/CLAUDE.md`

- [ ] **Step 1: Update test setup**

Edit `server/tests/setup.js`. In the env-var block, add:

```js
process.env.DS_LEASE_TEMPLATE_ID = process.env.DS_LEASE_TEMPLATE_ID || "tpl_test_lease";
```

- [ ] **Step 2: Update root `CLAUDE.md`**

In the "Required env vars" section's DocuSign line, append `, DS_LEASE_TEMPLATE_ID`. Preserve the rest of the line exactly as the F-207 doc update left it.

- [ ] **Step 3: Update `server/CLAUDE.md`**

In the DocuSign env-var line, append `, DS_LEASE_TEMPLATE_ID`. Below the env-vars list, append:

```markdown
### DocuSign lease template

`DS_LEASE_TEMPLATE_ID` is the UUID of a DocuSign template authored in the DocuSign UI. The template must:

- Define a recipient with role name `tenant` (case-sensitive)
- Use text tabs with labels: `tenantName`, `tenantEmail`, `unitNumber`, `facilityName`, `monthlyPrice`, `startDate`
- Include at least one signature tab assigned to the `tenant` role
```

- [ ] **Step 4: Confirm suite still passes**

Run: `cd server && npm test`
Expected: 77/77 still pass.

- [ ] **Step 5: Commit**

```bash
git add server/tests/setup.js CLAUDE.md server/CLAUDE.md
git commit -m "Document DS_LEASE_TEMPLATE_ID env var and required template tabs"
```

---

## Task 3: leaseService.startRental — extract Stripe checkout

**Files:**
- Create: `server/services/leaseService.js`
- Create: `server/tests/services/leaseService.startRental.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/leaseService.startRental.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const sessionsCreate = vi.fn();
const pricesRetrieve = vi.fn();

vi.mock("../../services/stripeConnect.js", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: sessionsCreate } },
    prices: { retrieve: pricesRetrieve },
  }),
  assertStripeReadyForCompany: vi.fn(async (companyId) => {
    const Company = (await import("../../models/company.js")).default;
    return Company.findById(companyId);
  }),
}));

import { startRental } from "../../services/leaseService.js";

beforeEach(async () => {
  sessionsCreate.mockReset();
  pricesRetrieve.mockReset();
});

describe("leaseService.startRental", () => {
  it("creates a Stripe session, persists a Rental linked to the Tenant, returns checkoutUrl", async () => {
    const company = await makeCompany({ stripe: { accountId: "acct_x", onboardingComplete: true } });
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility, { stripe: { accountId: "acct_x", priceId: "price_123", currency: "usd" } });
    const tenant = await makeTenant({ company: company._id });

    pricesRetrieve.mockResolvedValue({ unit_amount: 10000, currency: "usd", type: "one_time", active: true });
    sessionsCreate.mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.example/checkout/abc" });

    const { checkoutUrl, rentalId } = await startRental({
      company,
      facility,
      unit,
      tenant,
      successUrl: "https://app.example.test/success",
      cancelUrl: "https://app.example.test/cancel",
    });

    expect(checkoutUrl).toBe("https://stripe.example/checkout/abc");
    expect(typeof rentalId).toBe("string");

    const rental = await Rental.findById(rentalId);
    expect(rental).not.toBeNull();
    expect(rental.tenant.toString()).toBe(tenant._id.toString());
    expect(rental.status).toBe("pending");
    expect(rental.signingStatus).toBe("unsent");
    expect(rental.checkoutSessionId).toBe("cs_test_abc");
    expect(rental.amount).toBe(100);
  });

  it("throws if the unit has no Stripe price", async () => {
    const company = await makeCompany({ stripe: { accountId: "acct_x", onboardingComplete: true } });
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility, { stripe: undefined });
    const tenant = await makeTenant({ company: company._id });

    await expect(
      startRental({ company, facility, unit, tenant, successUrl: "x", cancelUrl: "y" })
    ).rejects.toThrow(/price/i);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/leaseService.startRental.test.js`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the service file**

Create `server/services/leaseService.js`:

```js
import Rental from "../models/rental.js";
import { getStripeClient, assertStripeReadyForCompany } from "./stripeConnect.js";

const sanitizeMetadata = (meta) =>
  Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, v === undefined || v === null ? "" : String(v)])
  );

export async function startRental({
  company,
  facility,
  unit,
  tenant,
  successUrl,
  cancelUrl,
}) {
  if (!unit?.stripe?.priceId) {
    throw new Error("Unit is not configured with a Stripe price");
  }
  if (!successUrl || !cancelUrl) {
    throw new Error("successUrl and cancelUrl are required");
  }

  const stripe = getStripeClient();
  const verifiedCompany = await assertStripeReadyForCompany(company._id);
  const stripeAccountId = unit.stripe.accountId || verifiedCompany.stripe?.accountId;
  const priceId = unit.stripe.priceId;

  const price = await stripe.prices.retrieve(priceId, {
    stripeAccount: stripeAccountId,
    expand: ["product"],
  });
  if (!price || price.active === false) {
    throw new Error("Unit's Stripe price is inactive");
  }

  const isRecurring = price.type === "recurring";
  const checkoutMode = isRecurring ? "subscription" : "payment";

  const metadata = sanitizeMetadata({
    companyId: company._id.toString(),
    facilityId: facility._id.toString(),
    unitId: unit._id.toString(),
    tenantId: tenant._id.toString(),
  });

  const sessionPayload = {
    mode: checkoutMode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    customer_email: tenant.contactInfo?.email || undefined,
    metadata,
  };

  if (checkoutMode === "payment") {
    sessionPayload.payment_intent_data = { metadata };
  } else {
    sessionPayload.subscription_data = { metadata };
  }

  const session = await stripe.checkout.sessions.create(sessionPayload, {
    stripeAccount: stripeAccountId,
  });

  const priceAmount =
    typeof price.unit_amount === "number"
      ? price.unit_amount / 100
      : unit.paymentInfo?.pricePerMonth;

  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    tenantEmail: tenant.contactInfo?.email || undefined,
    tenantName: [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") || undefined,
    amount: priceAmount,
    currency: price.currency || "usd",
    checkoutSessionId: session.id,
    stripeAccountId,
    stripePriceId: priceId,
    status: "pending",
    signingStatus: "unsent",
    metadata,
  });

  return { checkoutUrl: session.url, rentalId: rental._id.toString() };
}
```

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/services/leaseService.startRental.test.js`
Expected: PASS, 2/2.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/services/leaseService.js server/tests/services/leaseService.startRental.test.js
git commit -m "Add leaseService.startRental — Stripe checkout extracted from paymentController"
```

---

## Task 4: Refactor createUnitCheckoutSession to delegate to leaseService

**Files:**
- Modify: `server/controllers/paymentController.js`

No new tests — the refactor must preserve observable behavior. Existing tests are the contract.

- [ ] **Step 1: Replace the function body**

In `server/controllers/paymentController.js`:

(a) Add import at the top (alongside the existing imports):
```js
import * as leaseService from "../services/leaseService.js";
import mongoose from "mongoose";
```

(b) Replace the `createUnitCheckoutSession` function entirely with:

```js
export const createUnitCheckoutSession = async (req, res) => {
  try {
    const { unitId, tenantEmail, tenantName, successUrl, cancelUrl } = req.body;

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    const unit = await StorageUnit.findById(unitId).populate("facility");
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    if (!unit.availability || unit.status === "Rented") {
      return res.status(409).json({ message: "Unit is not currently available" });
    }
    if (!unit.facility) {
      return res.status(409).json({ message: "Unit is missing facility association" });
    }

    let company;
    try {
      company = await assertStripeReadyForCompany(unit.facility.company);
    } catch (e) {
      if (e.message === "Company not found") return res.status(404).json({ message: e.message });
      if (
        e.message === "Company is not connected to Stripe" ||
        e.message === "Company has not completed Stripe onboarding"
      ) {
        return res.status(409).json({ message: e.message });
      }
      throw e;
    }

    const resolvedSuccess = successUrl || req.body.url;
    const resolvedCancel = cancelUrl || req.body.url;
    if (!resolvedSuccess || !resolvedCancel) {
      return res.status(400).json({ message: "Both successUrl and cancelUrl are required" });
    }

    const tenantShim = {
      _id: req.body.tenantId
        ? new mongoose.Types.ObjectId(req.body.tenantId)
        : new mongoose.Types.ObjectId(),
      firstName: tenantName || "",
      lastName: "",
      contactInfo: { email: tenantEmail || undefined },
    };

    let result;
    try {
      result = await leaseService.startRental({
        company,
        facility: unit.facility,
        unit,
        tenant: tenantShim,
        successUrl: resolvedSuccess,
        cancelUrl: resolvedCancel,
      });
    } catch (svcErr) {
      if (svcErr.message === "Unit is not configured with a Stripe price") {
        return res.status(409).json({ message: svcErr.message });
      }
      if (svcErr.message === "Unit's Stripe price is inactive") {
        return res.status(409).json({ message: svcErr.message });
      }
      throw svcErr;
    }

    const Rental = (await import("../models/rental.js")).default;
    const rental = await Rental.findById(result.rentalId);
    return res.status(200).json({
      id: rental.checkoutSessionId,
      url: result.checkoutUrl,
      amount: rental.amount,
      currency: rental.currency,
      mode: rental.checkoutMode || "payment",
    });
  } catch (error) {
    console.error("Error creating tenant checkout session:", error);
    if (error?.message === "Stripe secret key is not configured") {
      return res.status(500).json({ message: error.message });
    }
    if (error?.type === "StripeInvalidRequestError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to create checkout session" });
  }
};
```

Remove unused imports left over from the prior implementation (Stripe price retrieval helpers etc. were inline — they're gone). Keep `StorageUnit` and `assertStripeReadyForCompany` imports.

- [ ] **Step 2: Run full suite**

Run: `cd server && npm test`
Expected: All tests pass. If a payment-controller test fails, fix the test or the refactor — the response shape `{ id, url, amount, currency, mode }` must be preserved.

- [ ] **Step 3: Commit**

```bash
git add server/controllers/paymentController.js
git commit -m "Refactor createUnitCheckoutSession to delegate to leaseService.startRental"
```

---

## Task 5: Rewrite createTenantAndLease (new-tenant flow)

**Files:**
- Modify: `server/controllers/rentalController.js`
- Create: `server/tests/controllers/rentalController.createTenantAndLease.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/rentalController.createTenantAndLease.test.js`:

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

describe("POST /rental/:cid/:fid/:uid/rent — createTenantAndLease", () => {
  it("creates Tenant with status 'New' and returns checkoutUrl on happy path", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    startRental.mockResolvedValue({
      checkoutUrl: "https://stripe.example/checkout/x",
      rentalId: "rental_abc",
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({
        tenantInfo: {
          firstName: "New",
          lastName: "Tenant",
          email: `nt-${Date.now()}@example.com`,
          username: `nt-${Date.now()}`,
          password: "ValidPassword1!",
          dateOfBirth: "1990-01-01",
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
        },
        successUrl: "https://app.example.test/s",
        cancelUrl: "https://app.example.test/c",
      });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBe("https://stripe.example/checkout/x");
    expect(startRental).toHaveBeenCalledTimes(1);

    const tenants = await Tenant.find({ company: company._id });
    expect(tenants).toHaveLength(1);
    expect(tenants[0].status).toBe("New");
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

  it("rolls back the created Tenant if Stripe session creation fails", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    startRental.mockRejectedValue(new Error("stripe boom"));

    const email = `rollback-${Date.now()}@example.com`;
    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({
        tenantInfo: {
          firstName: "Roll",
          lastName: "Back",
          email,
          username: `rb-${Date.now()}`,
          password: "ValidPassword1!",
          dateOfBirth: "1990-01-01",
          street1: "1 A",
          city: "B",
          state: "TX",
          zipCode: "00000",
          country: "US",
          DLNumber: "DL1",
          DLExpire: "2030-01-01",
          DLState: "TX",
          recoveryQuestion1: "q1",
          recoveryAnswer1: "a1",
          recoveryQuestion2: "q2",
          recoveryAnswer2: "a2",
        },
        successUrl: "x",
        cancelUrl: "y",
      });

    expect(res.status).toBe(502);
    const tenants = await Tenant.find({ "contactInfo.email": email });
    expect(tenants).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, observe failures**

Run: `cd server && npx vitest run tests/controllers/rentalController.createTenantAndLease.test.js`
Expected: All 3 FAIL — current controller returns "Tenant and lease created." and never calls `startRental`.

- [ ] **Step 3: Rewrite the controller**

In `server/controllers/rentalController.js`, add imports if not already present:

```js
import * as leaseService from "../services/leaseService.js";
import Facility from "../models/facility.js";
```

(`Company` and `Tenant` should already be imported.)

Replace the `createTenantAndLease` function body with:

```js
export const createTenantAndLease = async (req, res) => {
  let tenant;
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { tenantInfo, successUrl, cancelUrl } = req.body;

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

    tenant = await Tenant.create({
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

    try {
      const { checkoutUrl, rentalId } = await leaseService.startRental({
        company,
        facility,
        unit,
        tenant,
        successUrl,
        cancelUrl,
      });
      return res.status(200).json({ checkoutUrl, rentalId });
    } catch (stripeErr) {
      if (tenant?._id) {
        await Tenant.deleteOne({ _id: tenant._id });
      }
      console.error("startRental failed:", stripeErr.message);
      return res.status(502).json({ message: "Failed to start rental payment" });
    }
  } catch (error) {
    console.error("Error processing the createTenantAndLease call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};
```

- [ ] **Step 4: Run the new test file**

Run: `cd server && npx vitest run tests/controllers/rentalController.createTenantAndLease.test.js`
Expected: PASS, 3/3.

- [ ] **Step 5: Run the full suite**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/rentalController.js server/tests/controllers/rentalController.createTenantAndLease.test.js
git commit -m "Rewrite createTenantAndLease to use leaseService.startRental; rollback Tenant on Stripe failure"
```

---

## Task 6: Replace F-001 stub — loginTenantAndCreateLease

**Files:**
- Modify: `server/controllers/rentalController.js`
- Modify: `server/helpers/password.js` (add `comparePassword` if missing)
- Replace: `server/tests/controllers/rentalController.test.js` (the existing F-001 test)

- [ ] **Step 1: Ensure comparePassword exists**

Run: `grep -n "comparePassword" server/helpers/password.js`

If no match, append to `server/helpers/password.js`:

```js
export async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}
```

(`bcrypt` is already imported at the top of that file; if not, add `import bcrypt from "bcrypt";` once.)

- [ ] **Step 2: Replace the F-001 regression test**

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

describe("POST /rental/:cid/:fid/:uid/login&rent — formerly F-001 stub", () => {
  it("returns 200 + checkoutUrl on valid creds", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `tenant-${Date.now()}@example.com`;
    await makeTenant({
      company: company._id,
      contactInfo: { email },
      password: await hashPassword("ValidPassword1!"),
    });

    startRental.mockResolvedValue({
      checkoutUrl: "https://stripe.example/checkout/login-x",
      rentalId: "rental_login_x",
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({
        email,
        password: "ValidPassword1!",
        successUrl: "https://app.example.test/s",
        cancelUrl: "https://app.example.test/c",
      });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBe("https://stripe.example/checkout/login-x");
    expect(startRental).toHaveBeenCalledTimes(1);
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

- [ ] **Step 3: Run, observe failures**

Run: `cd server && npx vitest run tests/controllers/rentalController.test.js`
Expected: All 3 FAIL — current handler returns 501.

- [ ] **Step 4: Rewrite the handler**

Update the import line for password helpers in `server/controllers/rentalController.js`:

```js
import {
  hashPassword,
  passwordValidator,
  comparePassword,
} from "../helpers/password.js";
```

Replace the body of `loginTenantAndCreateLease` with:

```js
export const loginTenantAndCreateLease = async (req, res) => {
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { email, password, successUrl, cancelUrl } = req.body;

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

    try {
      const { checkoutUrl, rentalId } = await leaseService.startRental({
        company,
        facility,
        unit,
        tenant,
        successUrl,
        cancelUrl,
      });
      return res.status(200).json({ checkoutUrl, rentalId });
    } catch (stripeErr) {
      console.error("startRental failed in login&rent:", stripeErr.message);
      return res.status(502).json({ message: "Failed to start rental payment" });
    }
  } catch (error) {
    console.error("Error processing the loginTenantAndCreateLease call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};
```

- [ ] **Step 5: Run the test**

Run: `cd server && npx vitest run tests/controllers/rentalController.test.js`
Expected: PASS, 3/3.

- [ ] **Step 6: Run the full suite**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/rentalController.js server/helpers/password.js server/tests/controllers/rentalController.test.js
git commit -m "Replace F-001 stub: loginTenantAndCreateLease now validates and calls leaseService.startRental"
```

---

## Task 7: leaseService.createEnvelope

**Files:**
- Modify: `server/services/leaseService.js`
- Create: `server/tests/services/leaseService.createEnvelope.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/leaseService.createEnvelope.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const envelopesCreate = vi.fn();
const recipientViewCreate = vi.fn();

vi.mock("../../services/docusignClient.js", () => ({
  default: async () => ({
    envelopesApi: {
      createEnvelope: envelopesCreate,
      createRecipientView: recipientViewCreate,
    },
    accountId: "acct_test",
  }),
}));

import { createEnvelope } from "../../services/leaseService.js";

beforeEach(() => {
  envelopesCreate.mockReset();
  recipientViewCreate.mockReset();
  process.env.DS_LEASE_TEMPLATE_ID = "tpl_test_lease";
  process.env.FRONTEND_URL = "https://app.example.test";
});

async function seedPaidRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company, { facilityName: "Sunny Self Storage" });
  const unit = await makeUnit(facility, { unitNumber: "U-42" });
  const tenant = await makeTenant({
    company: company._id,
    firstName: "Pat",
    lastName: "Renter",
    contactInfo: { email: "pat@example.com" },
  });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "paid",
    signingStatus: "unsent",
    ...overrides,
  });
  return { rental, tenant };
}

describe("leaseService.createEnvelope", () => {
  it("rejects with 'Payment not complete' if Rental.status is not paid", async () => {
    const { rental } = await seedPaidRental({ status: "pending" });
    await expect(createEnvelope({ rentalId: rental._id })).rejects.toThrow(/payment not complete/i);
    expect(envelopesCreate).not.toHaveBeenCalled();
  });

  it("creates envelope with template + tab labels, persists envelopeId and signingStatus", async () => {
    envelopesCreate.mockResolvedValue({ envelopeId: "env_xyz" });
    recipientViewCreate.mockResolvedValue({ url: "https://docusign.example/sign/abc" });

    const { rental, tenant } = await seedPaidRental();

    const result = await createEnvelope({ rentalId: rental._id });

    expect(result.envelopeId).toBe("env_xyz");
    expect(result.signingUrl).toBe("https://docusign.example/sign/abc");

    expect(envelopesCreate).toHaveBeenCalledTimes(1);
    const [accountId, opts] = envelopesCreate.mock.calls[0];
    expect(accountId).toBe("acct_test");
    expect(opts.envelopeDefinition.templateId).toBe("tpl_test_lease");
    expect(opts.envelopeDefinition.status).toBe("sent");
    const role = opts.envelopeDefinition.templateRoles[0];
    expect(role.roleName).toBe("tenant");
    expect(role.email).toBe("pat@example.com");
    expect(role.clientUserId).toBe(tenant._id.toString());
    const textTabLabels = role.tabs.textTabs.map((t) => t.tabLabel);
    expect(textTabLabels).toEqual(
      expect.arrayContaining([
        "tenantName",
        "tenantEmail",
        "unitNumber",
        "facilityName",
        "monthlyPrice",
        "startDate",
      ])
    );

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.envelopeId).toBe("env_xyz");
    expect(refreshed.signingStatus).toBe("sent");
  });

  it("is idempotent — re-use existing envelope, return fresh signing URL", async () => {
    recipientViewCreate.mockResolvedValue({ url: "https://docusign.example/sign/fresh" });

    const { rental } = await seedPaidRental({
      envelopeId: "env_existing",
      signingStatus: "sent",
    });

    const result = await createEnvelope({ rentalId: rental._id });

    expect(result.envelopeId).toBe("env_existing");
    expect(result.signingUrl).toBe("https://docusign.example/sign/fresh");
    expect(envelopesCreate).not.toHaveBeenCalled();
    expect(recipientViewCreate).toHaveBeenCalledTimes(1);
  });

  it("throws if DS_LEASE_TEMPLATE_ID is unset", async () => {
    delete process.env.DS_LEASE_TEMPLATE_ID;
    const { rental } = await seedPaidRental();
    await expect(createEnvelope({ rentalId: rental._id })).rejects.toThrow(/DS_LEASE_TEMPLATE_ID/);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/leaseService.createEnvelope.test.js`
Expected: FAIL — `createEnvelope` is not exported.

- [ ] **Step 3: Add createEnvelope to leaseService**

At the top of `server/services/leaseService.js`, add the docusign import (after the existing imports):

```js
import getEnvelopesApi from "./docusignClient.js";
```

Append the function to the same file:

```js
export async function createEnvelope({ rentalId }) {
  const templateId = process.env.DS_LEASE_TEMPLATE_ID;
  if (!templateId) {
    throw new Error("DS_LEASE_TEMPLATE_ID is not configured");
  }

  const rental = await Rental.findById(rentalId)
    .populate("tenant")
    .populate("unit")
    .populate("facility");

  if (!rental) {
    throw new Error("Rental not found");
  }
  if (rental.status !== "paid") {
    throw new Error("Payment not complete");
  }

  const { envelopesApi, accountId } = await getEnvelopesApi();
  const returnUrl = `${process.env.FRONTEND_URL || ""}/rental/${rental._id}/signed`;

  let envelopeId = rental.envelopeId;
  if (!envelopeId || rental.signingStatus === "unsent") {
    const tenant = rental.tenant;
    const unit = rental.unit;
    const facility = rental.facility;

    const tenantName = [tenant?.firstName, tenant?.lastName].filter(Boolean).join(" ");
    const tenantEmail = tenant?.contactInfo?.email;
    const monthlyPrice =
      typeof rental.amount === "number" ? rental.amount.toFixed(2) : "";
    const startDate = new Date().toISOString().slice(0, 10);

    const envelopeDefinition = {
      templateId,
      status: "sent",
      templateRoles: [
        {
          roleName: "tenant",
          name: tenantName,
          email: tenantEmail,
          clientUserId: tenant._id.toString(),
          tabs: {
            textTabs: [
              { tabLabel: "tenantName", value: tenantName },
              { tabLabel: "tenantEmail", value: tenantEmail || "" },
              { tabLabel: "unitNumber", value: unit?.unitNumber || "" },
              { tabLabel: "facilityName", value: facility?.facilityName || "" },
              { tabLabel: "monthlyPrice", value: monthlyPrice },
              { tabLabel: "startDate", value: startDate },
            ],
          },
        },
      ],
    };

    const created = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    envelopeId = created.envelopeId;
    rental.envelopeId = envelopeId;
    rental.signingStatus = "sent";
    await rental.save();
  }

  const tenantId = rental.tenant._id.toString();
  const recipientViewRequest = {
    returnUrl,
    authenticationMethod: "none",
    email: rental.tenant?.contactInfo?.email,
    userName: [rental.tenant?.firstName, rental.tenant?.lastName].filter(Boolean).join(" "),
    clientUserId: tenantId,
  };

  const view = await envelopesApi.createRecipientView(accountId, envelopeId, {
    recipientViewRequest,
  });

  return { envelopeId, signingUrl: view.url };
}
```

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/services/leaseService.createEnvelope.test.js`
Expected: PASS, 4/4.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/services/leaseService.js server/tests/services/leaseService.createEnvelope.test.js
git commit -m "Add leaseService.createEnvelope — DocuSign template envelope + embedded signing URL"
```

---

## Task 8: leaseController + route

**Files:**
- Create: `server/controllers/leaseController.js`
- Modify: `server/routes/rentalRoutes.js`
- Create: `server/tests/controllers/leaseController.createLeaseEnvelope.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/leaseController.createLeaseEnvelope.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));

import { createEnvelope } from "../../services/leaseService.js";

let app;
beforeEach(async () => {
  createEnvelope.mockReset();
  app = buildApp();
});

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id });
  return Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 100,
    status: "paid",
    signingStatus: "unsent",
    ...overrides,
  });
}

describe("POST /rental/:rentalId/lease/envelope", () => {
  it("returns 200 with signingUrl and envelopeId on happy path", async () => {
    const rental = await seedRental();
    createEnvelope.mockResolvedValue({
      envelopeId: "env_happy",
      signingUrl: "https://docusign.example/sign/happy",
    });

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();

    expect(res.status).toBe(200);
    expect(res.body.envelopeId).toBe("env_happy");
    expect(res.body.signingUrl).toBe("https://docusign.example/sign/happy");
    expect(createEnvelope).toHaveBeenCalledWith({ rentalId: rental._id.toString() });
  });

  it("returns 409 when Rental.status is not paid", async () => {
    const rental = await seedRental({ status: "pending" });
    createEnvelope.mockRejectedValue(new Error("Payment not complete"));

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();
    expect(res.status).toBe(409);
  });

  it("returns 404 when Rental does not exist", async () => {
    createEnvelope.mockRejectedValue(new Error("Rental not found"));

    const res = await api(app)
      .post(`/rental/507f1f77bcf86cd799439011/lease/envelope`)
      .send();
    expect(res.status).toBe(404);
  });

  it("returns 502 when DocuSign returns an unexpected error", async () => {
    const rental = await seedRental();
    createEnvelope.mockRejectedValue(new Error("DocuSign 500 boom"));

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/controllers/leaseController.createLeaseEnvelope.test.js`
Expected: All 4 FAIL — route does not exist.

- [ ] **Step 3: Create the controller**

Create `server/controllers/leaseController.js`:

```js
import * as leaseService from "../services/leaseService.js";

export const createLeaseEnvelope = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const result = await leaseService.createEnvelope({ rentalId });
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Unknown error";
    if (msg === "Rental not found") {
      return res.status(404).json({ message: msg });
    }
    if (msg === "Payment not complete") {
      return res.status(409).json({ message: msg });
    }
    if (msg === "DS_LEASE_TEMPLATE_ID is not configured") {
      console.error("DS_LEASE_TEMPLATE_ID is not configured");
      return res.status(500).json({ message: "Lease template not configured" });
    }
    console.error("createLeaseEnvelope failed:", msg);
    return res.status(502).json({ message: "Failed to create lease envelope" });
  }
};
```

- [ ] **Step 4: Register the route**

Edit `server/routes/rentalRoutes.js`. Add the import at the top:
```js
import * as leaseController from "../controllers/leaseController.js";
```

Add this route registration immediately BEFORE the existing `router.post("/:companyId/:facilityId/:unitId/rent", ...)` line:

```js
router.post(
  "/:rentalId/lease/envelope",
  authenticateAPIKey,
  leaseController.createLeaseEnvelope
);
```

The path has the literal `/lease/envelope` suffix; it does not collide with any existing route.

- [ ] **Step 5: Run controller tests**

Run: `cd server && npx vitest run tests/controllers/leaseController.createLeaseEnvelope.test.js`
Expected: PASS, 4/4.

- [ ] **Step 6: Run the full suite**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/leaseController.js server/routes/rentalRoutes.js server/tests/controllers/leaseController.createLeaseEnvelope.test.js
git commit -m "Add POST /rental/:rentalId/lease/envelope and leaseController"
```

---

## Final verification

- [ ] **Step F1: Full suite + lint**

Run: `cd server && npm test && npm run lint`
Expected: All tests pass; no new lint warnings beyond the two pre-existing ones (`deleteUsersWithCompany`, `facilityId`).

- [ ] **Step F2: Sanity-check F-001 closeout**

Run: `grep -n "501\|not yet implemented\|F-001" server/controllers/rentalController.js`
Expected: No matches.

- [ ] **Step F3: Push and (after user approval) open PR**

```bash
git push
gh pr create --title "Lease subsystem (sub-project 1): foundation + envelope dispatch" --body "$(cat <<'EOF'
## Summary
Replaces the F-001 501-stub with a working Pay -> Sign lease flow using DocuSign templates.

- New leaseService (startRental + createEnvelope)
- New leaseController.createLeaseEnvelope + route POST /rental/:rentalId/lease/envelope
- Rewritten createTenantAndLease + loginTenantAndCreateLease
- Extended Rental model: tenant, envelopeId, signingStatus, signedAt, signedPdfUrl
- New env var DS_LEASE_TEMPLATE_ID documented in CLAUDE.md

## Spec deviation
Tenant.status uses the existing enum (New|Active|Disabled) instead of the spec's pending|active|inactive — avoids a destructive migration.

## Test plan
- [ ] cd server && npm test passes
- [ ] cd server && npm run lint passes
- [ ] New tests under server/tests/services/, server/tests/controllers/, server/tests/unit/

Spec: docs/superpowers/specs/2026-05-13-lease-foundation-and-dispatch-design.md
Plan: docs/superpowers/plans/2026-05-13-lease-foundation-and-dispatch.md
EOF
)"
```

---

## Notes for the executor

- **Spec deviation:** Tenant.status uses the existing `["New", "Active", "Disabled"]` enum. `"New"` is the pending state; sub-project 2 transitions `"New" → "Active"` on lease signed. No migration script.
- **Mocking DocuSign:** `getEnvelopesApi` is the default export of `docusignClient.js`. The mock must export `default: async () => ({ envelopesApi, accountId })`.
- **Rental.status enum:** Already includes `"paid"`. We do not need to extend it for this sub-project.
- **Idempotency contract:** Re-calling `POST /lease/envelope` after a previous successful call returns a NEW signing URL but the SAME envelopeId. The 5-min URL lifetime makes this essential.
- **Don't widen scope:** No webhook handling. No signed-PDF storage. No Tenant.status transition. Those are sub-project 2.
- **TDD discipline:** Every task observes a failing test before writing code. If a test passes before the code change, it isn't testing the right thing — adjust the test until it captures the bug, then fix.
- **Existing factory note:** Tasks 5 & 6 pass `password: await hashPassword(...)` to `makeTenant` so login validation works.
