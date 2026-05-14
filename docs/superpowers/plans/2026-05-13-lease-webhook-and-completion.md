# Lease Webhook + Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DocuSign Connect tells us when an envelope is signed/declined/voided; we update Rental + Tenant, expose the signed PDF on demand, and reap stale pre-payment Tenants.

**Architecture:** New `POST /webhooks/docusign` endpoint with HMAC-verified raw body → `leaseService.applyEnvelopeEvent`. New `GET /rental/:rentalId/lease/pdf` → `leaseService.streamSignedPdf` (on-demand DocuSign fetch). New `server/processes/orphanCleanup.js` follows the `monthly.js`/`delinquency.js` pattern. The webhook router is mounted before `express.json()` in `app.js` so `express.raw()` per-route can consume the body.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest, `docusign-esign`, `crypto` (HMAC).

**Source spec:** [docs/superpowers/specs/2026-05-13-lease-webhook-and-completion-design.md](../specs/2026-05-13-lease-webhook-and-completion-design.md)

## Spec adaptations (intentional)

- **Event model has rigid enums.** Task 1 extends the existing `eventName` enum with `"Lease Signed"`, `"Lease Declined"`, `"Lease Voided"`. The `eventType` is set to the existing `"Integration"` value. Spec's `"lease.envelope.<status>"` strings become these new enum values.
- **`app.js` mounts `express.json()` globally.** Task 4 mounts `webhookRoutes` BEFORE that line so the webhook's per-route `express.raw()` can consume the body. No other routes are affected.
- **Orphan cleanup test pattern.** Task 7 follows `server/processes/monthly.js` — the script exports a `runOrphanCleanup({ disconnect })` function so tests can invoke it on the in-memory Mongo without triggering its own connect/disconnect.

## File map

Files added:
- `server/middleware/docusignHmac.js`
- `server/controllers/webhookController.js`
- `server/routes/webhookRoutes.js`
- `server/processes/orphanCleanup.js`
- `server/tests/middleware/docusignHmac.test.js`
- `server/tests/controllers/webhookController.test.js`
- `server/tests/controllers/leaseController.streamSignedPdf.test.js`
- `server/tests/services/leaseService.applyEnvelopeEvent.test.js`
- `server/tests/services/leaseService.streamSignedPdf.test.js`
- `server/tests/routes/webhookRoutes.test.js`
- `server/tests/processes/orphanCleanup.test.js`
- `server/tests/unit/eventLeaseEnum.test.js`

Files modified:
- `server/models/event.js` — add 3 enum values
- `server/services/leaseService.js` — append `applyEnvelopeEvent` + `streamSignedPdf`
- `server/controllers/leaseController.js` — append `streamSignedPdf` handler
- `server/routes/rentalRoutes.js` — register `GET /:rentalId/lease/pdf`
- `server/app.js` — mount webhook router BEFORE `express.json()`
- `server/tests/setup.js` — set `DS_CONNECT_HMAC_KEY` for tests
- `CLAUDE.md`, `server/CLAUDE.md` — document `DS_CONNECT_HMAC_KEY`, `ORPHAN_TENANT_AGE_DAYS`, DocuSign Connect setup

---

## Pre-flight

- [ ] **Step P1: Baseline tests pass**

Run: `cd server && npm test`
Expected: 92/92 pass (state at end of sub-project 1).

---

## Task 1: Extend Event enum for lease events

**Files:**
- Modify: `server/models/event.js`
- Create: `server/tests/unit/eventLeaseEnum.test.js`

- [ ] **Step 1: Write the failing schema test**

Create `server/tests/unit/eventLeaseEnum.test.js`:

```js
import { describe, it, expect } from "vitest";
import Event from "../../models/event.js";
import mongoose from "mongoose";

describe("Event schema — lease enum values", () => {
  it.each(["Lease Signed", "Lease Declined", "Lease Voided"])(
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

  it("rejects an unknown eventName", async () => {
    await expect(
      Event.create({
        eventType: "Integration",
        eventName: "Lease Bogus",
        message: "test event",
      })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/unit/eventLeaseEnum.test.js`
Expected: 3 "accepts" tests FAIL with the existing enum's validation message.

- [ ] **Step 3: Apply enum extension**

In `server/models/event.js`, find the `eventName` enum `values` array. Append three entries inside the array, in the "Integrations" comment section:

```js
        //Integrations
        "Lease Signed",
        "Lease Declined",
        "Lease Voided",
        //Notifications
        //Access Control
      ],
```

Preserve the rest of the array exactly.

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/unit/eventLeaseEnum.test.js`
Expected: 4/4 pass.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: 96/96 pass.

- [ ] **Step 6: Commit**

```bash
git add server/models/event.js server/tests/unit/eventLeaseEnum.test.js
git commit -m "Extend Event eventName enum with Lease Signed/Declined/Voided"
```

---

## Task 2: docusignHmac middleware

**Files:**
- Create: `server/middleware/docusignHmac.js`
- Create: `server/tests/middleware/docusignHmac.test.js`
- Modify: `server/tests/setup.js` (add HMAC key)

- [ ] **Step 1: Add HMAC key to test setup**

In `server/tests/setup.js`, add inside the env block:

```js
process.env.DS_CONNECT_HMAC_KEY = process.env.DS_CONNECT_HMAC_KEY || "test-hmac-key";
```

- [ ] **Step 2: Write the failing test**

Create `server/tests/middleware/docusignHmac.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import verifyDocusignHmac from "../../middleware/docusignHmac.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

function hmacFor(rawBody, key) {
  return crypto.createHmac("sha256", key).update(rawBody).digest("base64");
}

describe("docusignHmac middleware", () => {
  const KEY = "test-hmac-key";
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.DS_CONNECT_HMAC_KEY;
    process.env.DS_CONNECT_HMAC_KEY = KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.DS_CONNECT_HMAC_KEY;
    else process.env.DS_CONNECT_HMAC_KEY = originalKey;
  });

  it("calls next() and parses JSON body when HMAC matches", () => {
    const payload = JSON.stringify({ data: { envelopeId: "env_1" } });
    const buf = Buffer.from(payload);
    const req = { body: buf, headers: { "x-docusign-signature-1": hmacFor(buf, KEY) } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(req.body).toEqual({ data: { envelopeId: "env_1" } });
  });

  it("returns 401 when HMAC does not match", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "wrong-sig" } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when header is missing", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: {} };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("returns 503 when DS_CONNECT_HMAC_KEY is unset", () => {
    delete process.env.DS_CONNECT_HMAC_KEY;
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "anything" } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(503);
  });

  it("does not crash on length-mismatched header", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "short" } };
    const res = mockRes();
    let nextCalled = false;

    expect(() => verifyDocusignHmac(req, res, () => { nextCalled = true; })).not.toThrow();
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 3: Run, observe failure**

Run: `cd server && npx vitest run tests/middleware/docusignHmac.test.js`
Expected: module not found.

- [ ] **Step 4: Implement the middleware**

Create `server/middleware/docusignHmac.js`:

```js
import crypto from "crypto";

const verifyDocusignHmac = (req, res, next) => {
  const key = process.env.DS_CONNECT_HMAC_KEY;
  if (!key) {
    console.error("[docusignHmac] DS_CONNECT_HMAC_KEY is not set; rejecting webhook");
    return res.status(503).json({ error: "Webhook auth not configured" });
  }

  const received = req.headers["x-docusign-signature-1"];
  if (!received) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
  const expected = crypto.createHmac("sha256", key).update(rawBody).digest("base64");

  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  if (!crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    req.body = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch (parseErr) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  return next();
};

export default verifyDocusignHmac;
```

- [ ] **Step 5: Run, observe pass**

Run: `cd server && npx vitest run tests/middleware/docusignHmac.test.js`
Expected: 5/5 pass.

- [ ] **Step 6: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add server/middleware/docusignHmac.js server/tests/middleware/docusignHmac.test.js server/tests/setup.js
git commit -m "Add docusignHmac middleware for DocuSign Connect webhook signature verification"
```

---

## Task 3: leaseService.applyEnvelopeEvent

**Files:**
- Modify: `server/services/leaseService.js`
- Create: `server/tests/services/leaseService.applyEnvelopeEvent.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/leaseService.applyEnvelopeEvent.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Tenant from "../../models/tenant.js";
import Event from "../../models/event.js";

import { applyEnvelopeEvent } from "../../services/leaseService.js";

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id, status: "New" });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "paid",
    signingStatus: "sent",
    envelopeId: "env_abc",
    ...overrides,
  });
  return { rental, tenant, company };
}

describe("leaseService.applyEnvelopeEvent", () => {
  it("returns noop when Rental does not exist for envelopeId", async () => {
    const result = await applyEnvelopeEvent({ envelopeId: "env_missing", status: "completed" });
    expect(result).toEqual({ noop: true, reason: "rental-not-found" });
  });

  it("on completed: sets signingStatus=signed, signedAt, Tenant.status=Active, writes Event", async () => {
    const { rental, tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result).toEqual({ noop: false, signingStatus: "signed" });

    const refreshedRental = await Rental.findById(rental._id);
    expect(refreshedRental.signingStatus).toBe("signed");
    expect(refreshedRental.signedAt).toBeInstanceOf(Date);

    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("Active");

    const events = await Event.find({ eventName: "Lease Signed", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("on declined: sets signingStatus=declined, leaves Tenant untouched, writes Event", async () => {
    const { rental, tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "declined" });

    expect(result).toEqual({ noop: false, signingStatus: "declined" });
    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("New");
    const refreshedRental = await Rental.findById(rental._id);
    expect(refreshedRental.signingStatus).toBe("declined");

    const events = await Event.find({ eventName: "Lease Declined", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("on voided: sets signingStatus=voided, writes Event, Tenant unchanged", async () => {
    const { tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "voided" });

    expect(result).toEqual({ noop: false, signingStatus: "voided" });
    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("New");
    expect((await Event.find({ eventName: "Lease Voided", company: company._id }))).toHaveLength(1);
  });

  it("idempotent: re-applying same status returns already-applied noop", async () => {
    await seedRental({ signingStatus: "signed" });

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result).toEqual({ noop: true, reason: "already-applied" });
    expect(await Event.countDocuments({ eventName: "Lease Signed" })).toBe(0);
  });

  it("returns unmapped-status noop for non-terminal statuses (e.g. 'sent')", async () => {
    await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "sent" });

    expect(result).toEqual({ noop: true, reason: "unmapped-status" });
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/leaseService.applyEnvelopeEvent.test.js`
Expected: `applyEnvelopeEvent` not exported.

- [ ] **Step 3: Add the function**

Append to `server/services/leaseService.js` (after the existing exports):

```js
import Event from "../models/event.js";
import Tenant from "../models/tenant.js";

const STATUS_MAP = {
  completed: "signed",
  declined: "declined",
  voided: "voided",
};

const EVENT_NAME = {
  signed: "Lease Signed",
  declined: "Lease Declined",
  voided: "Lease Voided",
};

export async function applyEnvelopeEvent({ envelopeId, status }) {
  const rental = await Rental.findOne({ envelopeId }).populate("tenant");
  if (!rental) {
    return { noop: true, reason: "rental-not-found" };
  }

  const mapped = STATUS_MAP[status];
  if (!mapped) {
    return { noop: true, reason: "unmapped-status" };
  }

  if (rental.signingStatus === mapped) {
    return { noop: true, reason: "already-applied" };
  }

  rental.signingStatus = mapped;
  if (mapped === "signed") {
    rental.signedAt = new Date();
    if (rental.tenant && rental.tenant.status !== "Active") {
      rental.tenant.status = "Active";
      await rental.tenant.save();
    }
  }
  await rental.save();

  await Event.create({
    eventType: "Integration",
    eventName: EVENT_NAME[mapped],
    company: rental.company,
    facility: rental.facility,
    message: `Lease envelope ${envelopeId} -> ${mapped}`,
  });

  return { noop: false, signingStatus: mapped };
}
```

If `Tenant` or `Event` is already imported at the top of `leaseService.js`, do not duplicate. Move the new imports to the top of the file alongside existing imports rather than mid-file.

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/services/leaseService.applyEnvelopeEvent.test.js`
Expected: 6/6 pass.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/services/leaseService.js server/tests/services/leaseService.applyEnvelopeEvent.test.js
git commit -m "Add leaseService.applyEnvelopeEvent — DocuSign status -> Rental + Tenant + Event audit"
```

---

## Task 4: webhookController + route + app.js wiring

**Files:**
- Create: `server/controllers/webhookController.js`
- Create: `server/routes/webhookRoutes.js`
- Modify: `server/app.js`
- Create: `server/tests/controllers/webhookController.test.js`
- Create: `server/tests/routes/webhookRoutes.test.js`

- [ ] **Step 1: Write the failing controller test**

Create `server/tests/controllers/webhookController.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { applyEnvelopeEvent } from "../../services/leaseService.js";
import { docusignEnvelopeEvent } from "../../controllers/webhookController.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  applyEnvelopeEvent.mockReset();
});

describe("webhookController.docusignEnvelopeEvent", () => {
  it("returns 200 and calls applyEnvelopeEvent with extracted fields (data.* shape)", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: false, signingStatus: "signed" });
    const req = { body: { data: { envelopeId: "env_x", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledWith({ envelopeId: "env_x", status: "completed" });
  });

  it("falls back to top-level envelopeId/status fields", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: true, reason: "unmapped-status" });
    const req = { body: { envelopeId: "env_top", status: "sent" } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledWith({ envelopeId: "env_top", status: "sent" });
  });

  it("returns 200 for rental-not-found (idempotent / late delivery)", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: true, reason: "rental-not-found" });
    const req = { body: { data: { envelopeId: "env_missing", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 500 when applyEnvelopeEvent throws (DocuSign will retry)", async () => {
    applyEnvelopeEvent.mockRejectedValue(new Error("db down"));
    const req = { body: { data: { envelopeId: "env_y", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(500);
  });

  it("returns 200 when envelopeId is missing (cannot route the event)", async () => {
    const req = { body: { data: {} } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/controllers/webhookController.test.js`
Expected: module not found.

- [ ] **Step 3: Create the controller**

Create `server/controllers/webhookController.js`:

```js
import * as leaseService from "../services/leaseService.js";

export const docusignEnvelopeEvent = async (req, res) => {
  try {
    const body = req.body || {};
    const envelopeId = body?.data?.envelopeId ?? body.envelopeId ?? null;
    const status = body?.data?.envelopeSummary?.status ?? body.status ?? null;

    if (!envelopeId) {
      console.warn("[docusignWebhook] payload missing envelopeId; ignoring");
      return res.status(200).json({ ok: true, ignored: true });
    }

    const result = await leaseService.applyEnvelopeEvent({ envelopeId, status });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[docusignWebhook] handler failed:", error?.message || error);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
```

- [ ] **Step 4: Run controller test**

Run: `cd server && npx vitest run tests/controllers/webhookController.test.js`
Expected: 5/5 pass.

- [ ] **Step 5: Write the failing route/integration test**

Create `server/tests/routes/webhookRoutes.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { applyEnvelopeEvent } from "../../services/leaseService.js";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

function sign(rawBody, key) {
  return crypto.createHmac("sha256", key).update(rawBody).digest("base64");
}

let app;
beforeEach(() => {
  applyEnvelopeEvent.mockReset();
  applyEnvelopeEvent.mockResolvedValue({ noop: false, signingStatus: "signed" });
  process.env.DS_CONNECT_HMAC_KEY = "test-hmac-key";
  app = buildApp();
});

describe("POST /webhooks/docusign", () => {
  it("200 + calls applyEnvelopeEvent when HMAC matches", async () => {
    const payload = JSON.stringify({
      data: { envelopeId: "env_route", envelopeSummary: { status: "completed" } },
    });

    const res = await api(app)
      .post("/webhooks/docusign")
      .set("Content-Type", "application/json")
      .set("X-DocuSign-Signature-1", sign(payload, "test-hmac-key"))
      .send(payload);

    expect(res.status).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledTimes(1);
  });

  it("401 when HMAC is wrong", async () => {
    const payload = JSON.stringify({
      data: { envelopeId: "env_route", envelopeSummary: { status: "completed" } },
    });

    const res = await api(app)
      .post("/webhooks/docusign")
      .set("Content-Type", "application/json")
      .set("X-DocuSign-Signature-1", "deadbeef")
      .send(payload);

    expect(res.status).toBe(401);
    expect(applyEnvelopeEvent).not.toHaveBeenCalled();
  });

  it("non-webhook JSON endpoints still parse JSON normally (mount order check)", async () => {
    // Hit a route that requires JSON body parsing. Any non-500 means express.json() still works.
    const res = await api(app)
      .post("/companies/create")
      .send({ companyName: "X" });
    // Auth or validation may reject, but the response must come from the controller (not a 500 from broken body parsing).
    expect(res.status).toBeLessThan(500);
  });
});
```

- [ ] **Step 6: Run, observe failure**

Run: `cd server && npx vitest run tests/routes/webhookRoutes.test.js`
Expected: 404 on `/webhooks/docusign` (router not mounted).

- [ ] **Step 7: Create the router**

Create `server/routes/webhookRoutes.js`:

```js
import express from "express";
import verifyDocusignHmac from "../middleware/docusignHmac.js";
import * as webhookController from "../controllers/webhookController.js";

const router = express.Router();

router.post(
  "/docusign",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyDocusignHmac,
  webhookController.docusignEnvelopeEvent
);

export default router;
```

- [ ] **Step 8: Mount BEFORE express.json() in app.js**

Edit `server/app.js`. Add the import alongside the other route imports:

```js
import webhookRoutes from "./routes/webhookRoutes.js";
```

Inside `buildApp()`, find the line `app.use(express.json());`. Insert the webhook mount IMMEDIATELY ABOVE that line (after `cors(...)` and the logging middleware but before `express.json()` / `bodyParser.json()`):

```js
  // Webhooks must consume raw body for HMAC verification — mount BEFORE express.json()
  app.use("/webhooks", webhookRoutes);
```

Resulting order inside `buildApp()`:
1. `app.use(cors(...))`
2. `app.use("/webhooks", webhookRoutes);` ← NEW
3. `app.use(express.json());`
4. `app.use(cookieParser());`
5. `app.use(bodyParser.json());`
6. `app.use(express.urlencoded(...))`
7. logging middleware
8. (rest unchanged)

- [ ] **Step 9: Run route test**

Run: `cd server && npx vitest run tests/routes/webhookRoutes.test.js`
Expected: 3/3 pass.

- [ ] **Step 10: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass. If any pre-existing JSON-body test breaks, the mount order is wrong — check that `app.use("/webhooks", ...)` came BEFORE `app.use(express.json())`.

- [ ] **Step 11: Commit**

```bash
git add server/controllers/webhookController.js server/routes/webhookRoutes.js server/app.js server/tests/controllers/webhookController.test.js server/tests/routes/webhookRoutes.test.js
git commit -m "Add /webhooks/docusign route + controller; mount before express.json()"
```

---

## Task 5: leaseService.streamSignedPdf

**Files:**
- Modify: `server/services/leaseService.js`
- Create: `server/tests/services/leaseService.streamSignedPdf.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/leaseService.streamSignedPdf.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const getDocument = vi.fn();
vi.mock("../../services/docusignClient.js", () => ({
  default: async () => ({
    envelopesApi: { getDocument },
    accountId: "acct_test",
  }),
}));

import { streamSignedPdf } from "../../services/leaseService.js";

function mockRes() {
  return {
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(buf) { this.body = buf; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.jsonBody = body; return this; },
  };
}

beforeEach(() => {
  getDocument.mockReset();
});

async function seed(overrides = {}) {
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
    signingStatus: "signed",
    envelopeId: "env_signed",
    signedAt: new Date(),
    ...overrides,
  });
}

describe("leaseService.streamSignedPdf", () => {
  it("happy path: writes PDF headers and ends with buffer", async () => {
    const rental = await seed();
    const pdfBuf = Buffer.from("%PDF-1.4 fake");
    getDocument.mockResolvedValue(pdfBuf);

    const res = mockRes();
    await streamSignedPdf({ rentalId: rental._id, res });

    expect(getDocument).toHaveBeenCalledWith("acct_test", "env_signed", "combined");
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toMatch(/lease-/);
    expect(res.body).toBe(pdfBuf);
  });

  it("throws 'Lease not signed' when signingStatus is not 'signed'", async () => {
    const rental = await seed({ signingStatus: "sent" });
    const res = mockRes();
    await expect(streamSignedPdf({ rentalId: rental._id, res })).rejects.toThrow(/lease not signed/i);
    expect(getDocument).not.toHaveBeenCalled();
  });

  it("throws 'Rental not found' for unknown id", async () => {
    const res = mockRes();
    await expect(
      streamSignedPdf({ rentalId: "507f1f77bcf86cd799439011", res })
    ).rejects.toThrow(/rental not found/i);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/leaseService.streamSignedPdf.test.js`
Expected: `streamSignedPdf` not exported.

- [ ] **Step 3: Append the function**

In `server/services/leaseService.js`, append:

```js
export async function streamSignedPdf({ rentalId, res }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) {
    throw new Error("Rental not found");
  }
  if (rental.signingStatus !== "signed") {
    throw new Error("Lease not signed");
  }

  const { envelopesApi, accountId } = await getEnvelopesApi();
  const pdfBuffer = await envelopesApi.getDocument(accountId, rental.envelopeId, "combined");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="lease-${rental._id}.pdf"`);
  res.end(pdfBuffer);
}
```

`getEnvelopesApi` is already imported at the top of the file (from sub-project 1, Task 7). If not, add `import getEnvelopesApi from "./docusignClient.js";` once.

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/services/leaseService.streamSignedPdf.test.js`
Expected: 3/3 pass.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/services/leaseService.js server/tests/services/leaseService.streamSignedPdf.test.js
git commit -m "Add leaseService.streamSignedPdf — on-demand DocuSign PDF fetch"
```

---

## Task 6: leaseController.streamSignedPdf + route

**Files:**
- Modify: `server/controllers/leaseController.js`
- Modify: `server/routes/rentalRoutes.js`
- Create: `server/tests/controllers/leaseController.streamSignedPdf.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/leaseController.streamSignedPdf.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { streamSignedPdf } from "../../services/leaseService.js";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

let app;
beforeEach(async () => {
  streamSignedPdf.mockReset();
  app = buildApp();
});

async function seed() {
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
    signingStatus: "signed",
    envelopeId: "env_x",
  });
}

describe("GET /rental/:rentalId/lease/pdf", () => {
  it("200 with PDF body on happy path", async () => {
    const rental = await seed();
    streamSignedPdf.mockImplementation(async ({ res }) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="lease-${rental._id}.pdf"`);
      res.end(Buffer.from("%PDF-1.4 mocked"));
    });

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/pdf/);
  });

  it("404 when Rental not found", async () => {
    streamSignedPdf.mockRejectedValue(new Error("Rental not found"));

    const res = await api(app).get(`/rental/507f1f77bcf86cd799439011/lease/pdf`);
    expect(res.status).toBe(404);
  });

  it("409 when Lease not signed", async () => {
    streamSignedPdf.mockRejectedValue(new Error("Lease not signed"));
    const rental = await seed();

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);
    expect(res.status).toBe(409);
  });

  it("502 on other DocuSign errors", async () => {
    streamSignedPdf.mockRejectedValue(new Error("DocuSign 500 boom"));
    const rental = await seed();

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/controllers/leaseController.streamSignedPdf.test.js`
Expected: 404 for all (route not registered).

- [ ] **Step 3: Add the controller handler**

In `server/controllers/leaseController.js`, append:

```js
export const streamSignedPdf = async (req, res) => {
  try {
    const { rentalId } = req.params;
    await leaseService.streamSignedPdf({ rentalId, res });
  } catch (error) {
    const msg = error?.message || "Unknown error";
    if (msg === "Rental not found") return res.status(404).json({ message: msg });
    if (msg === "Lease not signed") return res.status(409).json({ message: msg });
    console.error("streamSignedPdf failed:", msg);
    return res.status(502).json({ message: "Failed to fetch signed PDF" });
  }
};
```

(`leaseService` is already imported at the top from sub-project 1.)

- [ ] **Step 4: Register the route**

In `server/routes/rentalRoutes.js`, find the existing `router.post("/:rentalId/lease/envelope", ...)` line. Immediately after it, add:

```js
router.get(
  "/:rentalId/lease/pdf",
  authenticateAPIKey,
  leaseController.streamSignedPdf
);
```

(`leaseController` and `authenticateAPIKey` are already imported.)

- [ ] **Step 5: Run test + full suite**

```
cd server && npx vitest run tests/controllers/leaseController.streamSignedPdf.test.js
cd server && npm test
```
Expected: 4/4 new pass; full suite green.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/leaseController.js server/routes/rentalRoutes.js server/tests/controllers/leaseController.streamSignedPdf.test.js
git commit -m "Add GET /rental/:rentalId/lease/pdf endpoint + leaseController.streamSignedPdf"
```

---

## Task 7: orphanCleanup process file

**Files:**
- Create: `server/processes/orphanCleanup.js`
- Create: `server/tests/processes/orphanCleanup.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/processes/orphanCleanup.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";
import Rental from "../../models/rental.js";
import { runOrphanCleanup } from "../../processes/orphanCleanup.js";

const TEN_DAYS_AGO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  process.env.ORPHAN_TENANT_AGE_DAYS = "7";
});

describe("orphanCleanup.runOrphanCleanup", () => {
  it("keeps New tenant with paid Rental", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });
    await Rental.create({
      company: company._id, facility: facility._id, unit: unit._id,
      tenant: tenant._id, amount: 100, status: "paid",
    });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });

  it("deletes New tenant with no Rental, older than threshold", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).toBeNull();
  });

  it("deletes New tenant + pending Rental older than threshold", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });
    const rental = await Rental.create({
      company: company._id, facility: facility._id, unit: unit._id,
      tenant: tenant._id, amount: 100, status: "pending",
    });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).toBeNull();
    expect(await Rental.findById(rental._id)).toBeNull();
  });

  it("keeps New tenant within grace window (3 days old)", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { createdAt: THREE_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });

  it("keeps Active tenant regardless of age", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "Active" });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/processes/orphanCleanup.test.js`
Expected: module not found.

- [ ] **Step 3: Create the process file**

Create `server/processes/orphanCleanup.js`:

```js
import mongoose from "mongoose";
import dotenv from "dotenv";

import Tenant from "../models/tenant.js";
import Rental from "../models/rental.js";

dotenv.config();

// Exported so tests can invoke without triggering the connect/disconnect lifecycle.
export const runOrphanCleanup = async ({ disconnect = true } = {}) => {
  const ageDays = Number(process.env.ORPHAN_TENANT_AGE_DAYS || 7);
  const cutoff = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);

  const candidates = await Tenant.find({ status: "New", createdAt: { $lt: cutoff } });

  let deleted = 0;
  for (const tenant of candidates) {
    const paid = await Rental.findOne({ tenant: tenant._id, status: "paid" });
    if (paid) continue;
    await Rental.deleteMany({ tenant: tenant._id });
    await Tenant.deleteOne({ _id: tenant._id });
    deleted += 1;
  }

  console.log(`orphanCleanup: deleted ${deleted} orphan tenants older than ${ageDays} days`);

  if (disconnect) {
    await mongoose.disconnect();
  }

  return { deleted, ageDays };
};

// Allow running this file directly: `node server/processes/orphanCleanup.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    .then(() => runOrphanCleanup({ disconnect: true }))
    .catch((err) => {
      console.error("orphanCleanup failed:", err);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run, observe pass**

Run: `cd server && npx vitest run tests/processes/orphanCleanup.test.js`
Expected: 5/5 pass.

- [ ] **Step 5: Full suite stays green**

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/processes/orphanCleanup.js server/tests/processes/orphanCleanup.test.js
git commit -m "Add processes/orphanCleanup — sweep stale pending tenants"
```

---

## Task 8: Document env vars + DocuSign Connect setup

**Files:**
- Modify: `CLAUDE.md` (root), `server/CLAUDE.md`

- [ ] **Step 1: Update root `CLAUDE.md`**

In the "Required env vars" section, append two bullets after the existing DocuSign line:

```
- DocuSign Connect: `DS_CONNECT_HMAC_KEY` (HMAC secret for /webhooks/docusign)
- Background jobs: `ORPHAN_TENANT_AGE_DAYS` (default 7)
```

Preserve all other content.

- [ ] **Step 2: Update `server/CLAUDE.md`**

In the "Env vars" section, append the same two entries to the existing list.

Below the existing "### DocuSign lease template" section, append:

```markdown
### DocuSign Connect (webhook)

`DS_CONNECT_HMAC_KEY` is the shared secret used to verify webhook callbacks from DocuSign Connect. Configured in DocuSign Admin:

1. Admin → Integrations → Connect → Configurations
2. Add Configuration → "Custom"
3. URL to publish: `https://<your-host>/webhooks/docusign`
4. Event filter: Envelope → Envelope Signed/Completed, Envelope Declined, Envelope Voided
5. Require HMAC: yes, paste the same secret you set as `DS_CONNECT_HMAC_KEY`
6. Format: JSON (Aggregate)

### Orphan tenant cleanup

`server/processes/orphanCleanup.js` deletes Tenants with `status: "New"` older than `ORPHAN_TENANT_AGE_DAYS` (default 7) that have no `paid` Rental. Run via cron/PM2:

    node server/processes/orphanCleanup.js

The script is safe to re-run; it only deletes tenants that have no paid rental.
```

- [ ] **Step 3: Run full suite (sanity check — docs change only)**

Run: `cd server && npm test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md server/CLAUDE.md
git commit -m "Document DS_CONNECT_HMAC_KEY, ORPHAN_TENANT_AGE_DAYS, and Connect setup"
```

---

## Final verification

- [ ] **Step F1: Full suite + lint**

Run: `cd server && npm test && npm run lint`
Expected: All tests pass; no new lint warnings beyond the 2 pre-existing ones (`deleteUsersWithCompany`, `facilityId`).

- [ ] **Step F2: Confirm webhook isolation**

Run: `grep -n "express.raw\|express.json\|webhookRoutes" server/app.js`
Expected: `app.use("/webhooks", webhookRoutes)` appears BEFORE `app.use(express.json())`.

- [ ] **Step F3: Confirm sub-project 1 endpoints still work**

```
cd server && npx vitest run tests/controllers/rentalController.test.js
cd server && npx vitest run tests/controllers/rentalController.createTenantAndLease.test.js
cd server && npx vitest run tests/controllers/leaseController.createLeaseEnvelope.test.js
```
Expected: all pass.

- [ ] **Step F4: Push and (after user approval) open PR**

```bash
git push
gh pr create --title "Lease subsystem (sub-project 2): webhook + signed PDF + orphan cleanup" --body "$(cat <<'EOF'
## Summary
Closes the lease loop on the server: DocuSign Connect callbacks update Rental + Tenant, signed PDFs stream on demand, and a cleanup script reaps stale pending tenants.

- New POST /webhooks/docusign with HMAC verification
- New GET /rental/:rentalId/lease/pdf streams the signed PDF from DocuSign on demand
- Tenant.status transitions New -> Active on lease signed
- Event audit rows for Lease Signed/Declined/Voided
- New server/processes/orphanCleanup.js reaps stale "New" tenants (default 7 days)
- New env vars: DS_CONNECT_HMAC_KEY, ORPHAN_TENANT_AGE_DAYS

## Spec adaptations
- Event enum extended additively with Lease Signed/Declined/Voided (eventType=Integration)
- webhookRoutes mounted before express.json() so per-route express.raw() can verify HMAC

## Test plan
- [ ] cd server && npm test passes
- [ ] cd server && npm run lint passes
- [ ] Failing tests observed before each fix (TDD)
- [ ] webhookRoutes isolation: other JSON endpoints continue to parse JSON

Spec: docs/superpowers/specs/2026-05-13-lease-webhook-and-completion-design.md
Plan: docs/superpowers/plans/2026-05-13-lease-webhook-and-completion.md
EOF
)"
```

---

## Notes for the executor

- **DocuSign Connect must be configured externally** for the webhook to be exercised end-to-end. Local tests mock the service entirely, so no live DocuSign account is required for `npm test`.
- **Raw-body order matters.** If a test using JSON-body assertion on a non-webhook endpoint regresses, double-check `app.js`: `app.use("/webhooks", webhookRoutes)` must come BEFORE `app.use(express.json())` AND `app.use(bodyParser.json())`.
- **Idempotency contract:** webhook handlers always return 200 except on true internal errors. DocuSign retries on non-2xx; we want it to stop retrying once the event has been seen.
- **Don't widen scope:** no Stripe refund automation, no Unit auto-unlock on declined/voided, no signed-PDF archival.
- **TDD discipline:** each task observes a failing test before writing code. If a test passes pre-fix, the test isn't asserting the right thing — adjust it before writing the fix.
