# Deployment Gap Closer (Stripe Webhook + Admin Cron) — Design

**Date:** 2026-05-14
**Source request:** Enable end-to-end production flow on Render free/paid tier without manual DB intervention. Currently blocked because (1) no Stripe webhook receiver means `Rental.status` never transitions `pending → paid`, and (2) the `processes/*.js` background jobs have no scheduler invoking them.

## Goal

Two narrowly-scoped HTTP surfaces that unblock production deployment:

1. **`POST /webhooks/stripe`** — Stripe-signed webhook that transitions a Rental from `pending → paid` on `checkout.session.completed`.
2. **`POST /admin/cron/:job`** — API-key-protected endpoint that runs `delinquency`, `monthly`, or `orphan-cleanup` synchronously so an external scheduler (GitHub Actions cron, Render Cron Jobs, etc.) can drive them.

Plus a `docs/RENDER.md` deployment checklist.

## Locked-in decisions

| Decision | Choice | Rationale |
|---|---|---|
| Stripe event scope | `checkout.session.completed` only | Sole goal is unblocking the existing happy path. Other events (expired/failed/refunded) are a follow-up. |
| Stripe webhook side-effects | Transition Rental + write Event row only | Envelope creation stays client-driven via existing `POST /rental/:rentalId/lease/envelope`. Keeps webhook narrow. |
| Cron endpoint shape | One generic `POST /admin/cron/:job` with whitelist | One route, one test scaffold; easy to add jobs later. |
| Cron auth | Existing `API_KEY` (header `x-api-key`) | High-privilege secret already managed by operators. No new credential. |
| Cron response | Synchronous; returns `{ ok, job, durationMs, result }` | Caller's logs see slow-growth signals. Jobs are bounded so sync is fine. |
| Auto-trigger envelope from webhook | No | The `createLeaseEnvelope` endpoint is idempotent and client-driven; keeps surfaces independent. |

## Architecture

```
Stripe (cloud)
   │  POST /webhooks/stripe   (checkout.session.completed)
   ▼
┌──────────────────────────────┐
│ verifyStripeSignature        │ — STRIPE_WEBHOOK_SECRET, raw body
│ stripeWebhookController      │ — extract session.id, dispatch
└────────────┬─────────────────┘
             ▼
   paymentService.handleCheckoutCompleted({ sessionId, paymentIntentId })
        ├── find Rental by checkoutSessionId
        ├── idempotency: if status === "paid" → noop
        ├── set status = "paid", set paymentIntentId
        └── write Event "Payment Recieved" (existing enum, pre-existing misspelling)


External scheduler (GitHub Actions cron / Render Cron / etc.)
   │  POST /admin/cron/:job   (x-api-key)
   ▼
┌──────────────────────────────┐
│ authenticateAPIKey           │
│ adminCronController.runCronJob│ — whitelist job, dynamic-import, call fn
└────────────┬─────────────────┘
             ▼
   { delinquency: updateTenantStatus,
     monthly: updateTenantBalance,
     "orphan-cleanup": runOrphanCleanup }[job]({ disconnect: false })
```

## Components

### `server/middleware/stripeWebhookAuth.js` — new

Verifies `Stripe-Signature` header against `process.env.STRIPE_WEBHOOK_SECRET` using the Stripe SDK's `stripe.webhooks.constructEvent(rawBody, sig, secret)` helper. The SDK handles signature version drift and timestamp validation.

- Requires `req.body` to be a Buffer (raw body).
- Calls `next()` after attaching the parsed event to `req.stripeEvent`.
- Returns 503 if `STRIPE_WEBHOOK_SECRET` is unset (mirrors docusignHmac pattern from sub-project 2 so monitoring distinguishes config-error from genuine signature mismatch).
- Returns 400 if signature is invalid.

### `server/services/paymentService.js` — new

Single exported function:

**`handleCheckoutCompleted({ sessionId, paymentIntentId })`**:
1. `Rental.findOne({ checkoutSessionId: sessionId })`.
2. If not found → return `{ noop: true, reason: "rental-not-found" }`.
3. If `rental.status === "paid"` → return `{ noop: true, reason: "already-applied" }`.
4. Set `rental.status = "paid"`, `rental.paymentIntentId = paymentIntentId`, save.
5. Write `Event` row: `{ eventType: "Billing", eventName: "Payment Recieved", company, facility, message }`. The misspelling matches the pre-existing enum value at `server/models/event.js:28`.
6. Return `{ noop: false }`.

### `server/controllers/stripeWebhookController.js` — new

`handleStripeWebhook(req, res)`:
- Reads `req.stripeEvent` (set by middleware).
- Switch on `event.type`:
  - `"checkout.session.completed"` → call `paymentService.handleCheckoutCompleted({ sessionId: event.data.object.id, paymentIntentId: event.data.object.payment_intent })`.
  - Default → respond 200 `{ ok: true, ignored: event.type }`.
- 200 on noop + success.
- 500 only if the service throws unexpectedly (Stripe will retry).

### `server/routes/webhookRoutes.js` — modified

(File already exists from sub-project 2.) Add a second route alongside the existing `/docusign`:

```js
router.post(
  "/stripe",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyStripeSignature,
  stripeWebhookController.handleStripeWebhook
);
```

Mount order in `app.js` is unchanged — `/webhooks` already comes before `express.json()` (established in sub-project 2).

### `server/controllers/adminCronController.js` — new

```js
const JOBS = {
  delinquency:       async () => (await import("../processes/delinquency.js")).updateTenantStatus,
  monthly:           async () => (await import("../processes/monthly.js")).updateTenantBalance,
  "orphan-cleanup":  async () => (await import("../processes/orphanCleanup.js")).runOrphanCleanup,
};

export const runCronJob = async (req, res) => {
  const { job } = req.params;
  if (!JOBS[job]) return res.status(404).json({ error: "Unknown job" });
  const start = Date.now();
  try {
    const fn = await JOBS[job]();
    const result = await fn({ disconnect: false });
    return res.status(200).json({ ok: true, job, durationMs: Date.now() - start, result });
  } catch (e) {
    console.error(`[cron] ${job} failed:`, e);
    return res.status(500).json({ ok: false, job, error: e.message, durationMs: Date.now() - start });
  }
};
```

Dynamic imports keep the controller cheap to load and avoid pulling in `mongoose.connect` code paths from the process files at module-init time.

### `server/routes/adminRoutes.js` — new

```js
import express from "express";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import * as adminCronController from "../controllers/adminCronController.js";

const router = express.Router();

router.post("/cron/:job", authenticateAPIKey, adminCronController.runCronJob);

export default router;
```

### `server/app.js` — modified

Add the import alongside existing route imports:

```js
import adminRoutes from "./routes/adminRoutes.js";
```

Inside `buildApp()`, after `express.json()` and `bodyParser.json()` (NOT before — admin/cron takes empty body or JSON; no raw-body needed):

```js
app.use("/admin", adminRoutes);
```

### `server/tests/setup.js` — modified

Add:

```js
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
```

### `docs/RENDER.md` — new

Deployment checklist covering:

- Required env vars (full list grouped: core, Mongo, Stripe + webhook, DocuSign + Connect HMAC, OpenTech, gate, frontend).
- MongoDB Atlas M0 setup: how to get the connection string, IP allowlist `0.0.0.0/0` for Render's dynamic egress, recommended `serverSelectionTimeoutMS: 10000`.
- Stripe webhook setup: Dashboard → Developers → Webhooks → Add endpoint → `https://<your-render-service>.onrender.com/webhooks/stripe`, select `checkout.session.completed`, copy signing secret to `STRIPE_WEBHOOK_SECRET`.
- DocuSign Connect setup: `https://<service>.onrender.com/webhooks/docusign` (cross-link to `server/CLAUDE.md`).
- OpenTech configuration: external (in OpenTech Admin), not Render-side (cross-link to `server/CLAUDE.md`).
- Cron scheduler option 1: Render Cron Jobs (paid, $1/mo each) — `curl -X POST -H "x-api-key: $API_KEY" https://<service>.onrender.com/admin/cron/<job>`.
- Cron scheduler option 2: GitHub Actions (free for public repos). Sample workflow:

```yaml
name: cron-jobs
on:
  schedule:
    - cron: "0 6 * * *"      # daily 06:00 UTC — delinquency + orphan cleanup
    - cron: "0 7 1 * *"      # monthly 07:00 UTC on the 1st — monthly billing
jobs:
  delinquency:
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

- Free-tier limitation note: web service spin-down means first request after idle takes 30–60s. Stripe + DocuSign Connect both retry, so this is acceptable. Optional UptimeRobot ping to `/docusign/ping` keeps the instance warm.

### `CLAUDE.md` (root) + `server/CLAUDE.md` — modified

Add `STRIPE_WEBHOOK_SECRET` to the Stripe env-var list. Cross-link `docs/RENDER.md` from the root README pointer.

## Endpoints summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/webhooks/stripe` | Stripe signature (HMAC-SHA256 via SDK) | Transition Rental on `checkout.session.completed` |
| POST | `/admin/cron/:job` | API key | Invoke `delinquency` / `monthly` / `orphan-cleanup` |

## New env vars

- `STRIPE_WEBHOOK_SECRET` — issued by Stripe per webhook endpoint configured in the Stripe Dashboard. Distinct per environment (dev/staging/prod).

## Error matrix

| Endpoint | Failure | Status |
|---|---|---|
| `/webhooks/stripe` | Signature invalid | 400 |
| `/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` unset | 503 |
| `/webhooks/stripe` | Rental not found for session.id | 200 (logged; idempotent) |
| `/webhooks/stripe` | Already paid | 200 (idempotent noop) |
| `/webhooks/stripe` | Unknown `event.type` | 200 `{ ignored: type }` |
| `/webhooks/stripe` | Service throws unexpectedly | 500 (Stripe retries) |
| `/admin/cron/:job` | Missing API key | 401 |
| `/admin/cron/:job` | Unknown job | 404 |
| `/admin/cron/:job` | Job throws | 500 with `{ ok: false, error }` |

## Testing

- `server/tests/middleware/stripeWebhookAuth.test.js` — valid signature → `req.stripeEvent` set + `next()` called; invalid → 400; missing env → 503.
- `server/tests/services/paymentService.handleCheckoutCompleted.test.js` — rental-not-found noop; happy path transitions + Event row written with `eventName: "Payment Recieved"`; idempotent re-call; persists `paymentIntentId`.
- `server/tests/controllers/stripeWebhookController.test.js` — `checkout.session.completed` → service called with correct args; unknown event.type → 200 ignored; service throw → 500.
- `server/tests/routes/webhookRoutes.test.js` — extend with a Stripe end-to-end signed-request test. Generate a valid signature header using `stripe.webhooks.generateTestHeaderString({ payload, secret })`.
- `server/tests/controllers/adminCronController.test.js` — 404 unknown job; happy path returns `{ ok, job, durationMs, result }` for each of the 3 jobs (mock the underlying process functions); job-throws → 500; missing-API-key → 401.

## Sequencing within this sub-project

1. Stripe webhook auth middleware + STRIPE_WEBHOOK_SECRET in test setup
2. `paymentService.handleCheckoutCompleted`
3. `stripeWebhookController` + route registration in `webhookRoutes.js`
4. `adminCronController` + `adminRoutes.js` + mount in `app.js`
5. `docs/RENDER.md`
6. CLAUDE.md updates

Each step is one commit.

## Out of scope

- Other Stripe events: `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`, subscription events. Separate follow-up sub-project once the basics work.
- Stripe-event idempotency log table (e.g., `WebhookEvent` model). Current idempotency keyed on `Rental.status === "paid"` is sufficient for one event type. Once we handle multiple events, a log table is the right next step.
- `/health` endpoint for Render health checks. Trivial; add when actually deploying.
- Auto-triggering DocuSign envelope creation from the Stripe webhook. Kept client-driven for now (the existing `/lease/envelope` endpoint is already idempotent).
- Encrypted webhook secret at rest. Same approach as DocuSign HMAC and OpenTech credentials — deployment-layer encryption (Render's env-var encryption is sufficient).
- Per-environment webhook secret rotation tooling.

## Risks

- **Raw-body order matters.** Stripe SDK `constructEvent` requires the raw bytes. The `/webhooks` router already runs before `express.json()` (sub-project 2 set that up). The new `/stripe` route inside that router uses `express.raw({ type: "application/json" })` per-route. Mount order is preserved; if it ever breaks, the existing DocuSign tests will catch it.
- **Stripe SDK version sensitivity.** `constructEvent` is stable across SDK versions, but if the SDK is upgraded later, double-check the signature header name (`Stripe-Signature` is stable as of writing).
- **`API_KEY` doubles as cron auth key.** Reusing the existing key keeps key management simple but means a leaked API_KEY can trigger expensive jobs (e.g., spam `monthly` to corrupt balances). Mitigation: the jobs are idempotent on their own state (monthly already-paid units no-op), and the operator who controls `API_KEY` is already trusted with the same level of access via the existing tenant endpoints. Acceptable trade-off; flagged for review.
- **Render free tier spin-down.** The Stripe webhook hitting a cold instance takes 30–60s to wake. Stripe retries with exponential backoff up to 3 days, so the webhook eventually lands. For low traffic, this is fine. Documented in `RENDER.md`.
- **GitHub Actions cron drift.** GitHub Actions schedules are best-effort, not exact. A "daily 06:00 UTC" cron may run anywhere from 06:00 to 06:30 in practice. Documented in RENDER.md; not a problem for the jobs we're invoking.
