# Lease Webhook + Completion — Design

**Date:** 2026-05-13
**Parent project:** DocuSign lease subsystem (sub-project 2 of 3).
**Predecessor:** [Sub-project 1 — Lease Foundation + Envelope Dispatch](2026-05-13-lease-foundation-and-dispatch-design.md) (merged in PR #5).

## Goal

Close the lease loop: DocuSign tells us when an envelope is signed/declined/voided; we update Rental + Tenant accordingly, expose the signed PDF on demand, and reap stale pre-payment Tenants so the database stays tidy.

## Locked-in decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Webhook + on-demand PDF + Tenant `New→Active` + orphan cleanup | Coherent narrative around the same webhook entry point + Rental state machine; cleanup is small enough to bundle. |
| Signed-PDF storage | Fetch from DocuSign on demand (no local storage) | No new infra; DocuSign is source of truth; rental volume is modest. `Rental.signedPdfUrl` field stays unused for now (additive change to populate later if archival is added). |
| Webhook auth | HMAC SHA-256 via `X-DocuSign-Signature-1` header | DocuSign-recommended; matches the timing-safe-compare pattern from F-202. |
| Webhook payload | JSON (DocuSign Connect's Aggregate JSON format) | Modern default; trivial parsing. |
| Tenant lifecycle | `New → Active` on signed only; declined/voided record status but do NOT touch Tenant or Unit | Operator handles refund + unit unlock manually; avoids automated-refund risk. |
| Orphan cleanup | External-cron process file (`server/processes/orphanCleanup.js`); 7-day threshold via `ORPHAN_TENANT_AGE_DAYS` | Matches `monthly.js`/`delinquency.js` convention. |

## Architecture

```
                  DocuSign Connect (configured in DocuSign Admin)
                          │  POST signed envelope events
                          ▼
   ┌─────────────────────────────────────────────────┐
   │ POST /webhooks/docusign                          │  raw body retained for HMAC
   │   verifyDocusignHmac middleware                  │  X-DocuSign-Signature-1
   │   webhookController.docusignEnvelopeEvent       │  parses JSON, maps status
   └────────────┬─────────────────────────────────────┘
                ▼
   leaseService.applyEnvelopeEvent({ envelopeId, status })
        │
        ├── load Rental by envelopeId
        ├── idempotency check (return early if already in status)
        ├── update Rental.signingStatus
        │   • "completed" → "signed" + set signedAt + Tenant.status="Active"
        │   • "declined"  → "declined"
        │   • "voided"    → "voided"
        ├── write Event row (audit)
        └── save

GET /rental/:rentalId/lease/pdf            ← on-demand PDF fetch
   leaseController.streamSignedPdf
        │
        ├── load Rental
        ├── require signingStatus === "signed"
        ├── envelopesApi.getDocument(accountId, envelopeId, "combined")
        └── stream PDF to client

server/processes/orphanCleanup.js          ← runs externally (cron/PM2)
   • find Tenants where status:"New" AND createdAt < now - ORPHAN_TENANT_AGE_DAYS
   • for each: confirm no Rental exists with status:"paid" tied to that tenant
   • delete the Tenant + any pending/failed Rentals for it
   • log a summary
```

## Components

### `server/middleware/docusignHmac.js` — new

Verifies `X-DocuSign-Signature-1` against `process.env.DS_CONNECT_HMAC_KEY` using:

```js
const expected = crypto
  .createHmac("sha256", process.env.DS_CONNECT_HMAC_KEY)
  .update(rawBody)
  .digest("base64");
crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
```

Requires the raw request body. The webhook router uses `express.raw({ type: "application/json" })` on its single route so the body is a Buffer. After successful verification, the middleware parses the Buffer to JSON, sets `req.body`, and calls `next()`. Length-guard before `timingSafeEqual` (matches F-202 pattern). Rejects with 401 on mismatch, 503 when `DS_CONNECT_HMAC_KEY` is unset (and logs).

### `server/controllers/webhookController.js` — new

`docusignEnvelopeEvent(req, res)`:
- Extracts `envelopeId` and `status` from the Connect JSON payload. The Aggregate format places them at `data.envelopeId` and `data.envelopeSummary.status` (case may vary — handler is tolerant: also checks `envelopeId`/`status` at the top level).
- Calls `leaseService.applyEnvelopeEvent({ envelopeId, status })`.
- Returns 200 on every code path except hard server errors. DocuSign retries on non-2xx — we want it idempotent and forgiving.

### `server/routes/webhookRoutes.js` — new

Mounted at `/webhooks` in `app.js`. Single route:

```js
router.post(
  "/docusign",
  express.raw({ type: "application/json" }),
  verifyDocusignHmac,
  webhookController.docusignEnvelopeEvent
);
```

The raw-body parser is scoped to this router so it doesn't affect other endpoints that depend on `express.json()`.

### `server/services/leaseService.js` — extended

Append two exports:

**`applyEnvelopeEvent({ envelopeId, status })`**:
1. Load Rental by `envelopeId` (populate `tenant`).
2. If no Rental, return `{ noop: true, reason: "rental-not-found" }` (controller still returns 200).
3. Map DocuSign status → internal: `completed→signed`, `declined→declined`, `voided→voided`. Anything else (`sent`, `delivered`, etc.) → return `{ noop: true, reason: "unmapped-status" }`.
4. If `rental.signingStatus === mapped`, return `{ noop: true, reason: "already-applied" }`.
5. Set `rental.signingStatus = mapped`. If `mapped === "signed"`: also set `rental.signedAt = new Date()` and `rental.tenant.status = "Active"`.
6. Write an `Event` row: `{ type: "lease.envelope." + mapped, company, tenant, message, ...metadata }`. The Event model already exists.
7. Save Rental (and Tenant if changed).
8. Return `{ noop: false, signingStatus: mapped }`.

**`streamSignedPdf({ rentalId, res })`**:
1. Load Rental by `rentalId`.
2. Throw `new Error("Rental not found")` if not found.
3. Throw `new Error("Lease not signed")` if `signingStatus !== "signed"`.
4. `const { envelopesApi, accountId } = await getEnvelopesApi();`
5. Call `envelopesApi.getDocument(accountId, rental.envelopeId, "combined")` — the SDK returns a Buffer.
6. Set headers on `res`: `Content-Type: application/pdf`, `Content-Disposition: inline; filename="lease-<rentalId>.pdf"`.
7. `res.end(buffer)`.

### `server/controllers/leaseController.js` — extended

Append `streamSignedPdf` handler:

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

### `server/routes/rentalRoutes.js` — modified

Add the GET endpoint:

```js
router.get(
  "/:rentalId/lease/pdf",
  authenticateAPIKey,
  leaseController.streamSignedPdf
);
```

Placed adjacent to the existing `POST /:rentalId/lease/envelope` route.

### `server/processes/orphanCleanup.js` — new

ESM script mirroring `delinquency.js`/`monthly.js`:

```js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Tenant from "../models/tenant.js";
import Rental from "../models/rental.js";

const AGE_DAYS = Number(process.env.ORPHAN_TENANT_AGE_DAYS || 7);

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const cutoff = new Date(Date.now() - AGE_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await Tenant.find({ status: "New", createdAt: { $lt: cutoff } });

  let deleted = 0;
  for (const tenant of candidates) {
    const paid = await Rental.findOne({ tenant: tenant._id, status: "paid" });
    if (paid) continue;
    await Rental.deleteMany({ tenant: tenant._id });
    await Tenant.deleteOne({ _id: tenant._id });
    deleted += 1;
  }

  console.log(`orphanCleanup: deleted ${deleted} orphan tenants older than ${AGE_DAYS} days`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("orphanCleanup failed:", err);
  process.exit(1);
});
```

## Models

No schema changes. Sub-project 1 added the relevant fields. `Event` model is reused.

## Endpoints summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/webhooks/docusign` | HMAC | Process envelope status events |
| GET | `/rental/:rentalId/lease/pdf` | API key | Stream signed PDF on demand |

## New env vars

- `DS_CONNECT_HMAC_KEY` — secret configured in DocuSign Admin → Connect → Settings.
- `ORPHAN_TENANT_AGE_DAYS` — integer; default `7`.

Documented in `CLAUDE.md` (root) and `server/CLAUDE.md`. The DocuSign template tab section in `server/CLAUDE.md` gets a new sibling section "### DocuSign Connect (webhook)" explaining the operator setup.

## Error matrix

| Endpoint | Failure | Status |
|---|---|---|
| `POST /webhooks/docusign` | HMAC mismatch | 401 |
| `POST /webhooks/docusign` | `DS_CONNECT_HMAC_KEY` unset | 503 |
| `POST /webhooks/docusign` | Rental not found for envelopeId | 200 (logged) |
| `POST /webhooks/docusign` | Unknown DocuSign status | 200 (no-op) |
| `POST /webhooks/docusign` | Already in target status | 200 (idempotent no-op) |
| `POST /webhooks/docusign` | Unexpected service error | 500 (DocuSign will retry) |
| `GET /rental/:rentalId/lease/pdf` | Rental not found | 404 |
| `GET /rental/:rentalId/lease/pdf` | Not signed yet | 409 |
| `GET /rental/:rentalId/lease/pdf` | DocuSign `getDocument` fails | 502 |

## Testing

- `server/tests/middleware/docusignHmac.test.js` — valid HMAC passes (next called), invalid → 401, missing env → 503, length-mismatch handled gracefully.
- `server/tests/controllers/webhookController.test.js` — completed/declined/voided/unknown status; idempotency; rental-not-found returns 200.
- `server/tests/services/leaseService.applyEnvelopeEvent.test.js` — Rental + Tenant state changes; Event row written; idempotent re-application; declined/voided leave Tenant untouched.
- `server/tests/services/leaseService.streamSignedPdf.test.js` — happy path writes correct headers + buffer to a mock `res`; throws "Lease not signed" when status != signed; throws "Rental not found" when missing.
- `server/tests/controllers/leaseController.streamSignedPdf.test.js` — 200/404/409/502.
- `server/tests/routes/webhookRoutes.test.js` — end-to-end with mocked HMAC + service.
- `server/tests/processes/orphanCleanup.test.js` — seeds 5 scenarios and asserts the right deletions:
  - (a) `status:"New"` tenant + paid Rental → kept
  - (b) `status:"New"` tenant + no Rental, 10 days old → deleted
  - (c) `status:"New"` tenant + pending Rental, 10 days old → both deleted
  - (d) `status:"New"` tenant, 3 days old → kept (within grace window)
  - (e) `status:"Active"` tenant → kept

## Sequencing within this sub-project

1. `docusignHmac` middleware (failing test → impl)
2. `applyEnvelopeEvent` in leaseService (failing test → impl)
3. `webhookController.docusignEnvelopeEvent` + route + raw-body wiring in `app.js` (failing test → impl)
4. `streamSignedPdf` in leaseService (failing test → impl)
5. `leaseController.streamSignedPdf` + route (failing test → impl)
6. `processes/orphanCleanup.js` (failing test → impl)
7. CLAUDE.md docs for new env vars + DocuSign Connect setup

Each step = one commit.

## Out of scope

- Stripe refund automation on declined/voided (operator handles in Stripe directly)
- Unit unlock automation on declined/voided (operator handles in unit admin)
- Signed-PDF archival (S3/GridFS) — additive follow-up
- DocuSign Connect Polling-style fallback if Connect is down (DocuSign already retries)
- Tenant `Active → Disabled` automation (existing admin flows handle)
- Multi-party signing (sub-project 3)

## Risks

- **DocuSign Connect must be configured in DocuSign Admin.** Webhook URL (`https://<your-host>/webhooks/docusign`), HMAC key, and event filter (envelope status change → completed/declined/voided) all live in the DocuSign Admin UI, not in code. A setup checklist goes in `server/CLAUDE.md`.
- **Cron scheduling is external.** `orphanCleanup.js` is invoked by system cron / PM2 cron / k8s CronJob — same convention as the existing process files.
- **On-demand PDF fetch adds DocuSign latency.** Accepted per the Q2 decision. Documents are typically fetched once after signing for the operator's records, so the latency hit is rare.
- **HMAC misconfiguration silently drops events.** Mitigation: 503 (not 401) when the env var is unset so it surfaces in monitoring distinctly from "valid hash mismatch." The DocuSign Admin UI's "Republish" feature lets operators replay events after fixing config.
