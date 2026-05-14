# Deployment Gap Closer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Stripe webhook receiver (transition Rental `pending → paid` on `checkout.session.completed`) and an API-key-protected admin cron HTTP endpoint, plus a `docs/RENDER.md` deployment checklist. Unblocks the end-to-end happy path on any host without manual DB intervention.

**Architecture:** New `POST /webhooks/stripe` mounted alongside `/webhooks/docusign` (sub-project 2 already wired the `/webhooks` router before `express.json()`). Stripe signature verified via the SDK's `stripe.webhooks.constructEvent`. New `POST /admin/cron/:job` API-key-auth endpoint dispatches to the existing `processes/*.js` functions via a whitelist.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest, `stripe` (already a dep — `^16.5.0`), built-in `node:crypto`.

**Source spec:** [docs/superpowers/specs/2026-05-14-deployment-gap-closer-design.md](../specs/2026-05-14-deployment-gap-closer-design.md)

## File map

Files added:
- `server/middleware/stripeWebhookAuth.js`
- `server/services/paymentService.js`
- `server/controllers/stripeWebhookController.js`
- `server/controllers/adminCronController.js`
- `server/routes/adminRoutes.js`
- `docs/RENDER.md`
- `server/tests/middleware/stripeWebhookAuth.test.js`
- `server/tests/services/paymentService.handleCheckoutCompleted.test.js`
- `server/tests/controllers/stripeWebhookController.test.js`
- `server/tests/controllers/adminCronController.test.js`

Files modified:
- `server/routes/webhookRoutes.js` — add `/stripe` route
- `server/app.js` — mount `/admin`
- `server/tests/setup.js` — set `STRIPE_WEBHOOK_SECRET`
- `server/tests/routes/webhookRoutes.test.js` — extend with Stripe end-to-end test
- `CLAUDE.md`, `server/CLAUDE.md` — document `STRIPE_WEBHOOK_SECRET` + link RENDER.md

---

## Pre-flight

- [ ] **Step P1: Baseline tests pass**

Run: `cd server && npm test`
Expected: 168/168 pass (state at end of gate-integration sub-project).

---

## Task 1: stripeWebhookAuth middleware

**Files:**
- Create: `server/middleware/stripeWebhookAuth.js`
- Create: `server/tests/middleware/stripeWebhookAuth.test.js`
- Modify: `server/tests/setup.js`

- [ ] **Step 1: Add STRIPE_WEBHOOK_SECRET to test setup**

In `server/tests/setup.js`, inside the env block, add:

```js
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
```

- [ ] **Step 2: Write the failing test**

Create `server/tests/middleware/stripeWebhookAuth.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Stripe from "stripe";
import verifyStripeSignature from "../../middleware/stripeWebhookAuth.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

function signPayload(payload, secret) {
  const stripe = Stripe("sk_test_dummy");
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

describe("stripeWebhookAuth middleware", () => {
  const SECRET = "whsec_test";
  let originalSecret;

  beforeEach(() => {
    originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("attaches req.stripeEvent and calls next() when signature is valid", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_1" } } });
    const buf = Buffer.from(payload);
    const req = { body: buf, headers: { "stripe-signature": signPayload(payload, SECRET) } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(req.stripeEvent).toBeTruthy();
    expect(req.stripeEvent.type).toBe("checkout.session.completed");
    expect(req.stripeEvent.data.object.id).toBe("cs_1");
  });

  it("returns 400 on invalid signature", () => {
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: { "stripe-signature": "t=1,v1=bogus" } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when signature header is missing", () => {
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: {} };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is unset", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: { "stripe-signature": "anything" } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(503);
  });
});
```

- [ ] **Step 3: Run, observe failure**

Run: `cd server && npx vitest run tests/middleware/stripeWebhookAuth.test.js`
Expected: module not found.

- [ ] **Step 4: Create the middleware**

Create `server/middleware/stripeWebhookAuth.js`:

```js
import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "sk_test_dummy";

const stripe = new Stripe(stripeSecretKey);

const verifyStripeSignature = (req, res, next) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripeWebhookAuth] STRIPE_WEBHOOK_SECRET is not set; rejecting webhook");
    return res.status(503).json({ error: "Webhook auth not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ error: "Missing signature" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

  try {
    req.stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripeWebhookAuth] signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  return next();
};

export default verifyStripeSignature;
```

The Stripe client is initialized once at module load. `constructEvent` only uses the secret for HMAC — it doesn't actually call Stripe — so the secret key passed to `Stripe(...)` is irrelevant to webhook verification.

- [ ] **Step 5: Run + verify**

Run: `cd server && npx vitest run tests/middleware/stripeWebhookAuth.test.js`
Expected: 4/4 pass.

Run: `cd server && npm test`
Expected: 172/172 pass.

- [ ] **Step 6: Commit**

```bash
git add server/middleware/stripeWebhookAuth.js server/tests/middleware/stripeWebhookAuth.test.js server/tests/setup.js
git commit -m "Add stripeWebhookAuth middleware for Stripe webhook signature verification"
```

---

## Task 2: paymentService.handleCheckoutCompleted

**Files:**
- Create: `server/services/paymentService.js`
- Create: `server/tests/services/paymentService.handleCheckoutCompleted.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/tests/services/paymentService.handleCheckoutCompleted.test.js`:

```js
import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

import { handleCheckoutCompleted } from "../../services/paymentService.js";

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "pending",
    checkoutSessionId: "cs_test_abc",
    ...overrides,
  });
  return { rental, company, facility, tenant };
}

describe("paymentService.handleCheckoutCompleted", () => {
  it("returns noop when no Rental exists for the given session id", async () => {
    const result = await handleCheckoutCompleted({ sessionId: "cs_missing", paymentIntentId: "pi_x" });
    expect(result).toEqual({ noop: true, reason: "rental-not-found" });
  });

  it("transitions pending -> paid, persists paymentIntentId, writes Payment Recieved Event", async () => {
    const { rental, company } = await seedRental();

    const result = await handleCheckoutCompleted({ sessionId: "cs_test_abc", paymentIntentId: "pi_test_xyz" });

    expect(result).toEqual({ noop: false });

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.status).toBe("paid");
    expect(refreshed.paymentIntentId).toBe("pi_test_xyz");

    const events = await Event.find({ eventName: "Payment Recieved", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("is idempotent: re-call on an already-paid Rental returns noop and does not double-write Event", async () => {
    const { rental } = await seedRental({ status: "paid", paymentIntentId: "pi_existing" });

    const result = await handleCheckoutCompleted({ sessionId: "cs_test_abc", paymentIntentId: "pi_test_xyz" });

    expect(result).toEqual({ noop: true, reason: "already-applied" });

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.paymentIntentId).toBe("pi_existing");
    expect(await Event.countDocuments({ eventName: "Payment Recieved" })).toBe(0);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/services/paymentService.handleCheckoutCompleted.test.js`
Expected: module not found.

- [ ] **Step 3: Create the service**

Create `server/services/paymentService.js`:

```js
import Rental from "../models/rental.js";
import Event from "../models/event.js";

export async function handleCheckoutCompleted({ sessionId, paymentIntentId }) {
  const rental = await Rental.findOne({ checkoutSessionId: sessionId });
  if (!rental) {
    return { noop: true, reason: "rental-not-found" };
  }
  if (rental.status === "paid") {
    return { noop: true, reason: "already-applied" };
  }

  rental.status = "paid";
  if (paymentIntentId) {
    rental.paymentIntentId = paymentIntentId;
  }
  await rental.save();

  await Event.create({
    eventType: "Billing",
    eventName: "Payment Recieved",
    company: rental.company,
    facility: rental.facility,
    message: `Stripe session ${sessionId} -> paid`,
  });

  return { noop: false };
}
```

(Note: `"Payment Recieved"` is misspelled but matches the pre-existing enum value in `server/models/event.js:28`. Do not "fix" the misspelling — it would break the enum match.)

- [ ] **Step 4: Run + verify**

Run: `cd server && npx vitest run tests/services/paymentService.handleCheckoutCompleted.test.js`
Expected: 3/3 pass.

Run: `cd server && npm test`
Expected: 175/175 pass.

- [ ] **Step 5: Commit**

```bash
git add server/services/paymentService.js server/tests/services/paymentService.handleCheckoutCompleted.test.js
git commit -m "Add paymentService.handleCheckoutCompleted — transition Rental on Stripe payment"
```

---

## Task 3: stripeWebhookController + route

**Files:**
- Create: `server/controllers/stripeWebhookController.js`
- Modify: `server/routes/webhookRoutes.js`
- Create: `server/tests/controllers/stripeWebhookController.test.js`
- Modify: `server/tests/routes/webhookRoutes.test.js`

- [ ] **Step 1: Write the failing controller test**

Create `server/tests/controllers/stripeWebhookController.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";

const handleCheckoutCompletedMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/paymentService.js", () => ({
  handleCheckoutCompleted: handleCheckoutCompletedMock,
}));

import { handleStripeWebhook } from "../../controllers/stripeWebhookController.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  handleCheckoutCompletedMock.mockReset();
});

describe("stripeWebhookController.handleStripeWebhook", () => {
  it("dispatches checkout.session.completed to paymentService with sessionId + paymentIntentId", async () => {
    handleCheckoutCompletedMock.mockResolvedValue({ noop: false });
    const req = {
      stripeEvent: {
        type: "checkout.session.completed",
        data: { object: { id: "cs_evt", payment_intent: "pi_evt" } },
      },
    };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(handleCheckoutCompletedMock).toHaveBeenCalledWith({
      sessionId: "cs_evt",
      paymentIntentId: "pi_evt",
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 ignored for unhandled event types without calling the service", async () => {
    const req = { stripeEvent: { type: "customer.created", data: { object: {} } } };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ignored).toBe("customer.created");
    expect(handleCheckoutCompletedMock).not.toHaveBeenCalled();
  });

  it("returns 500 when the service throws (Stripe will retry)", async () => {
    handleCheckoutCompletedMock.mockRejectedValue(new Error("db down"));
    const req = {
      stripeEvent: { type: "checkout.session.completed", data: { object: { id: "cs_x", payment_intent: "pi_x" } } },
    };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.statusCode).toBe(500);
  });
});
```

- [ ] **Step 2: Run, observe failure**

Run: `cd server && npx vitest run tests/controllers/stripeWebhookController.test.js`
Expected: module not found.

- [ ] **Step 3: Create the controller**

Create `server/controllers/stripeWebhookController.js`:

```js
import * as paymentService from "../services/paymentService.js";

export const handleStripeWebhook = async (req, res) => {
  try {
    const event = req.stripeEvent;
    if (!event) {
      return res.status(400).json({ error: "Missing event" });
    }

    if (event.type === "checkout.session.completed") {
      const sess = event.data?.object || {};
      const result = await paymentService.handleCheckoutCompleted({
        sessionId: sess.id,
        paymentIntentId: sess.payment_intent || undefined,
      });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(200).json({ ok: true, ignored: event.type });
  } catch (err) {
    console.error("[stripeWebhook] handler failed:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
```

- [ ] **Step 4: Register the route**

Edit `server/routes/webhookRoutes.js`. Add imports at the top alongside existing imports:

```js
import verifyStripeSignature from "../middleware/stripeWebhookAuth.js";
import * as stripeWebhookController from "../controllers/stripeWebhookController.js";
```

After the existing `router.post("/docusign", ...)` registration, add:

```js
router.post(
  "/stripe",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyStripeSignature,
  stripeWebhookController.handleStripeWebhook
);
```

- [ ] **Step 5: Append the failing end-to-end test**

Append to `server/tests/routes/webhookRoutes.test.js` (at the bottom of the file as a new top-level `describe`):

```js
import Stripe from "stripe";

describe("POST /webhooks/stripe — end-to-end", () => {
  function makeStripeSig(payload, secret) {
    const stripe = Stripe("sk_test_dummy");
    return stripe.webhooks.generateTestHeaderString({ payload, secret });
  }

  let stripeApp;
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    stripeApp = buildApp();
  });

  it("200 + signature accepted on checkout.session.completed", async () => {
    const payload = JSON.stringify({
      id: "evt_e2e",
      type: "checkout.session.completed",
      data: { object: { id: "cs_e2e", payment_intent: "pi_e2e" } },
    });

    const res = await api(stripeApp)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", makeStripeSig(payload, "whsec_test"))
      .send(payload);

    expect(res.status).toBe(200);
  });

  it("400 when signature is wrong", async () => {
    const payload = JSON.stringify({ id: "evt_bad", type: "checkout.session.completed", data: { object: {} } });

    const res = await api(stripeApp)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", "t=1,v1=bogus")
      .send(payload);

    expect(res.status).toBe(400);
  });
});
```

(The variable is named `stripeApp` rather than `app` to avoid colliding with any `app` declared at the top of the file from the DocuSign tests.)

- [ ] **Step 6: Run + verify**

Run: `cd server && npx vitest run tests/controllers/stripeWebhookController.test.js tests/routes/webhookRoutes.test.js`
Expected: 3 controller + (3 existing DocuSign + 2 new Stripe) = 8/8 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/stripeWebhookController.js server/routes/webhookRoutes.js server/tests/controllers/stripeWebhookController.test.js server/tests/routes/webhookRoutes.test.js
git commit -m "Add /webhooks/stripe route + controller (checkout.session.completed)"
```

---

## Task 4: adminCronController + route

**Files:**
- Create: `server/controllers/adminCronController.js`
- Create: `server/routes/adminRoutes.js`
- Modify: `server/app.js`
- Create: `server/tests/controllers/adminCronController.test.js`

- [ ] **Step 1: Inspect the api() helper for an `x-api-key`-less option**

Read `server/tests/helpers/request.js`. The helper attaches `x-api-key` by default. If it doesn't already support skipping the key, add a `{ withKey: opts.withKey !== false }` option in a minimal edit. The test below uses `api(app, { withKey: false })` for the unauthorized case.

If `api()` does not currently accept an options bag, modify it minimally:

```js
// example minimal change in server/tests/helpers/request.js
export const api = (app, opts = {}) => {
  const r = request(app);
  if (opts.withKey === false) return r;
  // existing logic that sets x-api-key on every request...
};
```

The exact shape depends on the existing helper. If a wholesale rewrite would be needed, instead inline a no-header supertest call in the one test that needs it:

```js
import request from "supertest";
const res = await request(app).post("/admin/cron/delinquency").send();
```

Pick whichever is one-line.

- [ ] **Step 2: Write the failing test**

Create `server/tests/controllers/adminCronController.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

const updateTenantStatusMock = vi.hoisted(() => vi.fn());
const updateTenantBalanceMock = vi.hoisted(() => vi.fn());
const runOrphanCleanupMock = vi.hoisted(() => vi.fn());

vi.mock("../../processes/delinquency.js", () => ({
  updateTenantStatus: updateTenantStatusMock,
}));
vi.mock("../../processes/monthly.js", () => ({
  updateTenantBalance: updateTenantBalanceMock,
}));
vi.mock("../../processes/orphanCleanup.js", () => ({
  runOrphanCleanup: runOrphanCleanupMock,
}));

let app;
beforeEach(() => {
  updateTenantStatusMock.mockReset();
  updateTenantBalanceMock.mockReset();
  runOrphanCleanupMock.mockReset();
  app = buildApp();
});

describe("POST /admin/cron/:job", () => {
  it("returns 401 without API key", async () => {
    const res = await request(app).post("/admin/cron/delinquency").send();
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown job", async () => {
    const res = await api(app).post("/admin/cron/bogus").send();
    expect(res.status).toBe(404);
  });

  it("invokes delinquency and returns { ok, job, durationMs, result }", async () => {
    updateTenantStatusMock.mockResolvedValue({ updated: 3 });

    const res = await api(app).post("/admin/cron/delinquency").send();

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.job).toBe("delinquency");
    expect(typeof res.body.durationMs).toBe("number");
    expect(res.body.result).toEqual({ updated: 3 });
    expect(updateTenantStatusMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("invokes monthly", async () => {
    updateTenantBalanceMock.mockResolvedValue({ touched: 5 });

    const res = await api(app).post("/admin/cron/monthly").send();

    expect(res.status).toBe(200);
    expect(res.body.job).toBe("monthly");
    expect(updateTenantBalanceMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("invokes orphan-cleanup", async () => {
    runOrphanCleanupMock.mockResolvedValue({ deleted: 1, ageDays: 7 });

    const res = await api(app).post("/admin/cron/orphan-cleanup").send();

    expect(res.status).toBe(200);
    expect(res.body.job).toBe("orphan-cleanup");
    expect(runOrphanCleanupMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("returns 500 with { ok: false, error } when the job throws", async () => {
    updateTenantStatusMock.mockRejectedValue(new Error("DB blew up"));

    const res = await api(app).post("/admin/cron/delinquency").send();

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/DB blew up/);
  });
});
```

- [ ] **Step 3: Run, observe failure**

Run: `cd server && npx vitest run tests/controllers/adminCronController.test.js`
Expected: 404s (route not registered).

- [ ] **Step 4: Create the controller**

Create `server/controllers/adminCronController.js`:

```js
const JOBS = {
  delinquency:      async () => (await import("../processes/delinquency.js")).updateTenantStatus,
  monthly:          async () => (await import("../processes/monthly.js")).updateTenantBalance,
  "orphan-cleanup": async () => (await import("../processes/orphanCleanup.js")).runOrphanCleanup,
};

export const runCronJob = async (req, res) => {
  const { job } = req.params;
  if (!(job in JOBS)) {
    return res.status(404).json({ error: "Unknown job" });
  }
  const start = Date.now();
  try {
    const fn = await JOBS[job]();
    const result = await fn({ disconnect: false });
    return res.status(200).json({ ok: true, job, durationMs: Date.now() - start, result });
  } catch (e) {
    console.error(`[cron] ${job} failed:`, e?.message || e);
    return res.status(500).json({ ok: false, job, error: e?.message || String(e), durationMs: Date.now() - start });
  }
};
```

- [ ] **Step 5: Create the router**

Create `server/routes/adminRoutes.js`:

```js
import express from "express";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import * as adminCronController from "../controllers/adminCronController.js";

const router = express.Router();

router.post("/cron/:job", authenticateAPIKey, adminCronController.runCronJob);

export default router;
```

- [ ] **Step 6: Mount in app.js**

Edit `server/app.js`. Add the import alongside existing route imports:

```js
import adminRoutes from "./routes/adminRoutes.js";
```

Inside `buildApp()`, AFTER the existing `app.use(express.json())` line (NOT before — admin/cron is a normal JSON endpoint), add:

```js
app.use("/admin", adminRoutes);
```

A natural position is alongside the other top-level mounts (`/companies`, `/facilities`, etc.).

- [ ] **Step 7: Run + verify**

Run: `cd server && npx vitest run tests/controllers/adminCronController.test.js`
Expected: 6/6 pass.

Run: `cd server && npm test`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add server/controllers/adminCronController.js server/routes/adminRoutes.js server/app.js server/tests/controllers/adminCronController.test.js
git commit -m "Add /admin/cron/:job endpoint for external schedulers"
```

---

## Task 5: docs/RENDER.md

**Files:**
- Create: `docs/RENDER.md`

- [ ] **Step 1: Create the deployment doc**

Create `docs/RENDER.md` with the content below. The YAML block for GitHub Actions uses escaped `$` inside `${{ secrets... }}` because this Markdown lives in a docs file (the GitHub Actions YAML parser handles `${{ }}` directly — don't actually escape; the version below is the literal final text):

````markdown
# Deploying React-PMS on Render

This guide assumes you're deploying the **server** (Node/Express + Mongoose) to Render. The client (Vite + React) deploys separately as a Static Site or to another host.

## 1. Provision MongoDB

Render does not include managed Mongo on free tier. Use **MongoDB Atlas M0 (free, 512MB)**:

1. Create an Atlas project + cluster (M0 Shared).
2. **Network access:** allow `0.0.0.0/0` (Render's egress IPs are dynamic).
3. **Database user:** create one with `readWrite` on your DB. Copy the `mongodb+srv://...` connection string.
4. Save the connection string — it becomes `MONGO_URL`.

## 2. Create the Render Web Service

1. Render Dashboard → New → Web Service → connect your GitHub repo.
2. Runtime: **Node**. Build: `cd server && npm install`. Start: `cd server && npm start`.
3. Plan: **Free** works for testing; **Starter ($7/mo)** removes the 15-min spin-down.
4. Region: pick one close to your Atlas region for lower latency.

## 3. Environment variables

Set every variable below in Render's service settings → Environment.

**Core:** `MONGO_URL`, `PORT` (Render injects automatically), `JWT_SECRET`, `API_KEY`, `FRONTEND_URL`.

**Email (Nodemailer):** `EMAIL`, `PASS`.

**Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from step 4 below).

**DocuSign:** `DS_ACCOUNT_ID`, `DS_BASE_PATH`, `DS_INTEGRATION_KEY`, `DS_OAUTH_BASE`, `DS_USER_ID`, `DS_PRIVATE_KEY_B64`, `DS_LEASE_TEMPLATE_ID`, `DS_CONNECT_HMAC_KEY` (from step 5 below).

**OpenTech gate:** `OPENTECH_CLIENT_ID`, `OPENTECH_CLIENT_SECRET`, `OPENTECH_ENV` (`prod` or `dev`), `GATE_ACCESS_CODE_LENGTH` (default 8), `GATE_RETRY_BACKOFF_MS` (default "1000,2000,4000").

**Background jobs:** `ORPHAN_TENANT_AGE_DAYS` (default 7).

## 4. Configure Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. URL: `https://<your-render-service>.onrender.com/webhooks/stripe`.
3. Events: select **`checkout.session.completed`** only.
4. Copy the signing secret (`whsec_...`) → paste into Render's `STRIPE_WEBHOOK_SECRET` env var.
5. Test with the "Send test webhook" button in Stripe.

## 5. Configure DocuSign Connect

1. DocuSign Admin → Integrations → Connect → Configurations → **Add Configuration**.
2. URL: `https://<your-render-service>.onrender.com/webhooks/docusign`.
3. Format: **JSON (Aggregate)**.
4. Events: Envelope → Envelope Completed/Declined/Voided.
5. Require HMAC: paste the same secret you set as `DS_CONNECT_HMAC_KEY`.

(For the OpenTech setup, see `server/CLAUDE.md` → "Gate provider (OpenTech)" — it's done in OpenTech's own UI plus a per-Company Mongo update.)

## 6. Schedule the background jobs

`POST /admin/cron/:job` accepts `delinquency`, `monthly`, `orphan-cleanup`. API-key auth via `x-api-key` header.

### Option A — Render Cron Jobs (paid, $1/mo each)

Render Dashboard → New → Cron Job. For each:

- **Command:** `curl -fsS -X POST -H "x-api-key: $API_KEY" https://<your-render-service>.onrender.com/admin/cron/<job>`
- **Schedule:** `0 6 * * *` (daily 06:00 UTC) for delinquency and orphan-cleanup; `0 7 1 * *` (07:00 UTC on the 1st) for monthly.

Set `API_KEY` in the cron job's env (same value as the web service).

### Option B — GitHub Actions cron (free for public repos)

Add `.github/workflows/cron.yml`:

```yaml
name: cron-jobs
on:
  schedule:
    - cron: "0 6 * * *"      # daily 06:00 UTC — delinquency + orphan cleanup
    - cron: "0 7 1 * *"      # monthly 07:00 UTC on the 1st — monthly billing
jobs:
  daily:
    if: github.event.schedule == '0 6 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/delinquency
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/orphan-cleanup
  monthly:
    if: github.event.schedule == '0 7 1 * *'
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "x-api-key: ${{ secrets.RENDER_API_KEY }}" \
            https://${{ secrets.RENDER_HOST }}/admin/cron/monthly
```

Add two GitHub secrets:

- `RENDER_API_KEY` — same value as the Render web service's `API_KEY`.
- `RENDER_HOST` — e.g. `react-pms.onrender.com` (no `https://`, no path).

GitHub Actions cron is best-effort and may run up to 30 minutes late. Acceptable for these jobs.

## 7. Free-tier gotchas

- **Spin-down:** after 15 min of inactivity, the web service sleeps. The first request takes 30–60s. Stripe and DocuSign Connect both retry on non-2xx, so webhooks eventually land. To keep the instance warm, point UptimeRobot (free) at `GET /docusign/ping` every 5 min.
- **No persistent disk:** the codebase doesn't write to local disk by design (signed PDFs are fetched on demand from DocuSign).
- **No Mongo:** use Atlas M0 (see step 1).

## 8. Health check

Set Render's Health Check Path to `/docusign/ping` (returns 200 with `{ ok: true, accountId }` if DocuSign auth is working).

## 9. Verify end-to-end

After deploying, smoke-test the happy path:

1. Through the client UI, start a rental → tenant lands on Stripe checkout.
2. Use Stripe's test card `4242 4242 4242 4242` (any future expiry + CVC).
3. Stripe redirects back to `FRONTEND_URL`. Within seconds, `Rental.status` should be `paid` (check Mongo or your dashboard).
4. The client requests the lease envelope → tenant signs in DocuSign.
5. DocuSign Connect fires → `Rental.signingStatus` becomes `signed`, `Tenant.status` → `Active`.
6. If a gate provider is configured on the facility, the tenant's access code is provisioned in OpenTech.

If step 3 doesn't transition: check Stripe Dashboard → Webhooks → your endpoint → "Recent deliveries". Look for 200 responses. 400 = wrong secret. 503 = env var not set in Render.
````

- [ ] **Step 2: Commit**

```bash
git add docs/RENDER.md
git commit -m "Add docs/RENDER.md deployment checklist with Stripe webhook + cron setup"
```

---

## Task 6: Document STRIPE_WEBHOOK_SECRET in CLAUDE.md files

**Files:**
- Modify: `CLAUDE.md` (root)
- Modify: `server/CLAUDE.md`

- [ ] **Step 1: Update root `CLAUDE.md`**

In the "Required env vars" section, find the Stripe line. Add `STRIPE_WEBHOOK_SECRET` to it. The new line should read:

```
- Stripe: `STRIPE_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
```

Below the env-vars list, append a one-line pointer:

```
For full deployment instructions on Render see [docs/RENDER.md](docs/RENDER.md).
```

- [ ] **Step 2: Update `server/CLAUDE.md`**

In the "Env vars" section, append `STRIPE_WEBHOOK_SECRET` to the Stripe line.

Below the existing webhook documentation sections (DocuSign Connect, Orphan cleanup, Gate provider), append:

```markdown
### Stripe webhook

`STRIPE_WEBHOOK_SECRET` is the signing secret for the webhook endpoint configured in the Stripe Dashboard. The `/webhooks/stripe` endpoint verifies signatures via `stripe.webhooks.constructEvent`. Currently only `checkout.session.completed` is handled — it transitions Rental `pending -> paid` and writes a `Payment Recieved` Event. See `docs/RENDER.md` for setup steps.

### Admin cron endpoint

`POST /admin/cron/:job` (API-key auth) lets an external scheduler invoke background jobs. Whitelist:

- `delinquency` → `processes/delinquency.js#updateTenantStatus`
- `monthly` → `processes/monthly.js#updateTenantBalance`
- `orphan-cleanup` → `processes/orphanCleanup.js#runOrphanCleanup`

Returns `{ ok, job, durationMs, result }`. See `docs/RENDER.md` for GitHub Actions / Render Cron examples.
```

- [ ] **Step 3: Run full suite (sanity)**

Run: `cd server && npm test`
Expected: All still pass (docs only).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md server/CLAUDE.md
git commit -m "Document STRIPE_WEBHOOK_SECRET and admin cron endpoint"
```

---

## Final verification

- [ ] **Step F1: Full suite + lint**

Run: `cd server && npm test && npm run lint`
Expected: All tests pass; no new lint warnings beyond the 2 pre-existing (`deleteUsersWithCompany`, `facilityId`).

- [ ] **Step F2: Confirm webhook isolation + admin mount**

Run: `grep -n "express.raw\|express.json\|webhookRoutes\|adminRoutes" server/app.js`
Expected: `app.use("/webhooks", webhookRoutes)` BEFORE `app.use(express.json())`. `app.use("/admin", adminRoutes)` AFTER `app.use(express.json())`. Both `/webhooks/docusign` and `/webhooks/stripe` use per-route `express.raw()` inside the router.

- [ ] **Step F3: Confirm Stripe + DocuSign tests both pass**

```
cd server && npx vitest run tests/routes/webhookRoutes.test.js
cd server && npx vitest run tests/middleware/stripeWebhookAuth.test.js tests/middleware/docusignHmac.test.js
```
Expected: all pass.

- [ ] **Step F4: Push and (after user approval) open PR**

```bash
git push
gh pr create --title "Deployment gap closer: Stripe webhook + admin cron + RENDER.md" --body "$(cat <<'EOF'
## Summary
Unblocks end-to-end production deployment on any host (Render free or paid, anywhere else).

- New POST /webhooks/stripe — Stripe-signed webhook; on checkout.session.completed transitions Rental pending -> paid, persists paymentIntentId, writes Payment Recieved Event.
- New POST /admin/cron/:job — API-key-auth endpoint that invokes delinquency / monthly / orphan-cleanup synchronously. Returns { ok, job, durationMs, result } for scheduler logs.
- New docs/RENDER.md — full deployment checklist: Atlas setup, Render web service config, env vars, Stripe + DocuSign + OpenTech webhook URLs, GitHub Actions cron sample workflow.
- 1 new env var: STRIPE_WEBHOOK_SECRET.
- 4 new test files + 1 extension (Stripe end-to-end in webhookRoutes.test.js).

## What this unlocks
Before: tenant pays via Stripe -> Rental stuck at pending forever. Lease envelope endpoint refuses (asserts status === paid). End-to-end flow broken without manual DB edits.

After: full happy path works — pay -> webhook flips to paid -> client triggers DocuSign envelope -> tenant signs -> DocuSign webhook -> Tenant becomes Active + gate provisioned. Cron jobs run on whatever scheduler you point at the new admin endpoint.

## Test plan
- [ ] cd server && npm test passes
- [ ] cd server && npm run lint passes
- [ ] Failing tests observed before each fix (TDD)
- [ ] Stripe webhook signature verified via SDK (not raw HMAC)
- [ ] Admin cron whitelist rejects unknown jobs (404) and missing API key (401)
- [ ] Mount-order regression preserved (webhookRoutes before express.json; admin after)

## Out of scope (future)
- Other Stripe events (session.expired, payment_intent.failed, refunds, subscriptions)
- Stripe-event idempotency log table
- /health endpoint
- Auto-trigger DocuSign envelope from Stripe webhook

Spec: docs/superpowers/specs/2026-05-14-deployment-gap-closer-design.md
Plan: docs/superpowers/plans/2026-05-14-deployment-gap-closer.md
EOF
)"
```

---

## Notes for the executor

- **Stripe SDK is already a dependency** (`"stripe": "^16.5.0"` in `server/package.json`). No new install needed.
- **The webhook router is already mounted before `express.json()`** in `app.js` from sub-project 2. Tests in `tests/routes/webhookRoutes.test.js` already exercise this for DocuSign; extending them for Stripe doesn't change wiring.
- **Idempotency contract:** Stripe sends `event.id` per delivery, but we don't need an idempotency table for this single event type. Idempotency is via `Rental.status === "paid"` check inside `paymentService`. If we add more event types later, a `WebhookEvent` log table becomes the right pattern.
- **The cron endpoint reuses `authenticateAPIKey`** — same middleware that protects tenant routes. A leaked `API_KEY` already grants broad access to tenant data; adding cron-trigger to its surface is acceptable. Flagged in the spec.
- **Render env-var encryption** is sufficient for `STRIPE_WEBHOOK_SECRET` at rest. Same pattern as the existing `DS_CONNECT_HMAC_KEY` from sub-project 2.
- **Don't widen scope:** no other Stripe events, no idempotency log table, no `/health` endpoint, no auto-envelope-trigger from the Stripe webhook. Those are explicit follow-ups.
- **TDD discipline:** each task observes a failing test before writing code.
- **"Payment Recieved" misspelling:** matches the pre-existing enum value in `server/models/event.js`. Do not "fix" it — would break the enum.
