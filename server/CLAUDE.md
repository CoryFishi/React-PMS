# server/ — React-PMS API

Express 4 + Mongoose 8 on Node ESM. Entry is `index.js`. Stripe and DocuSign integrations live in `services/`. Auth is JWT in HTTP-only cookies; some endpoints use API-key auth for external integrations.

## Run

```bash
npm start         # nodemon index.js
npm run lint      # eslint, must stay at 0 warnings
```

## Tests

Vitest + mongodb-memory-server + supertest. Mocks for Stripe, DocuSign, Nodemailer.

- Run once: `npm test`
- Watch: `npm run test:watch`
- Coverage: `npm run test:coverage`

Tests live under `server/tests/` mirroring source layout (`controllers/`, `routes/`, `middleware/`, `unit/`). Shared helpers in `tests/helpers/` (factories for User/Company/Facility/Unit/Tenant/Rental/Payment, JWT cookie signer, supertest-with-api-key wrapper, and module mocks for Stripe/DocuSign/Nodemailer). Global setup in `tests/setup.js` starts an in-memory MongoDB once per worker and drops collections between tests.

When adding a new endpoint:
1. Add a controller test in `tests/controllers/<x>Controller.test.js` covering happy path + at least one error path.
2. Add a route test in `tests/routes/<x>Routes.test.js` proving both middleware layers (API key + JWT, if applicable) reject correctly.
3. Use factories from `tests/helpers/factories.js`; if your test needs a new entity shape, add a factory there rather than inlining.

ESLint config lives in the `eslintConfig` key of `package.json` (ESLint 8 legacy style). Don't add a separate `.eslintrc.*` file.

## Module layout

- `index.js` — express setup, cors with credentials, route mounting, Mongo connect, server start.
- `routes/<x>Routes.js` — Express routers. Thin: URL → middleware → controller. No business logic.
- `controllers/<x>Controller.js` — handler functions, exported as named exports. Business logic lives here.
- `models/<x>.js` — Mongoose schemas, one model per file, default export.
- `middleware/`
  - `authentication.js` — JWT cookie parsing, attaches user to `req`.
  - `apiKeyAuth.js` — API-key auth for external/automation endpoints.
  - `requireFacilityAdmin.js` — allows System_Admin or a Company_Admin whose company owns the facility; used by facility settings endpoints.
- `services/`
  - `stripeConnect.js` — Stripe SDK wrapper.
  - `docusignClient.js` — DocuSign envelope API (`getEnvelopesApi`).
- `processes/` — recurring background jobs (`delinquency.js`, `monthly.js`).
- `helpers/` — small utilities (`password.js` for bcrypt).

Mounted route prefixes (from `index.js`):

| Prefix          | Router               |
|-----------------|----------------------|
| `/companies`    | `companyRoutes.js`   |
| `/facilities`   | `facilityRoutes.js`  |
| `/tenants`      | `tenantRoutes.js`    |
| `/events`       | `eventRoutes.js`     |
| `/payments`     | `paymentRoutes.js`   |
| `/rental`       | `rentalRoutes.js`    |
| `/` (root)      | `userRoutes.js`      |

## Conventions

- ESM only. Imports use `.js` extensions on relative paths: `import x from "./foo.js"`.
- One Mongoose model per file, default-exported.
- Controllers: `export const createX = async (req, res) => { ... }`. Wrap async logic in try/catch; respond with appropriate status + JSON.
- Don't use `mongoose.connect` outside `index.js`.
- Don't add a top-level error handler that swallows errors — let known thrown errors return 4xx/5xx from the controller, log unexpected ones.
- New routers must be `import`-ed and `app.use(...)`-ed in `index.js`.
- API responses should be JSON objects; avoid raw strings.

## Domain entities

```
Company ── Facility ── Unit (UnitType) ── Rental ── Tenant
                                              └──── Payment
User (with Role)        Event (audit log)
```

When adding a new entity, mirror the existing triplet: `models/foo.js` + `controllers/fooController.js` + `routes/fooRoutes.js`, then mount in `index.js`.

## Env vars

Loaded via `dotenv` from `server/.env`. **Never read or echo the file's contents.** Variable names in use:

- Core: `MONGO_URL`, `PORT`, `JWT_SECRET`, `API_KEY`, `FRONTEND_URL`
- Email (Nodemailer): `EMAIL`, `PASS`
- Stripe: `STRIPE_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- DocuSign: `DS_ACCOUNT_ID`, `DS_BASE_PATH`, `DS_INTEGRATION_KEY`, `DS_OAUTH_BASE`, `DS_PRIVATE_KEY_B64`, `DS_USER_ID`, `DS_LEASE_TEMPLATE_ID`, `DS_CONNECT_HMAC_KEY`. Legacy `DS_PRIVATE_KEY_B` is still read with a deprecation warning.
- Background jobs: `ORPHAN_TENANT_AGE_DAYS`
- Gate (OpenTech): `OPENTECH_CLIENT_ID`, `OPENTECH_CLIENT_SECRET`, `OPENTECH_ENV`, `GATE_ACCESS_CODE_LENGTH`, `GATE_RETRY_BACKOFF_MS`

If a feature needs a new env var, add it here and document it in the root `CLAUDE.md`.

### DocuSign lease template

`DS_LEASE_TEMPLATE_ID` is the UUID of a DocuSign template authored in the DocuSign UI. The template must:

- Define a recipient with role name `tenant` (case-sensitive)
- Use text tabs with labels: `tenantName`, `tenantEmail`, `unitNumber`, `facilityName`, `monthlyPrice`, `startDate`
- Include at least one signature tab assigned to the `tenant` role

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

### Gate provider (OpenTech)

This codebase supports multiple gate vendors via a `GateProviderAdapter` interface. OpenTech is the first implementation.

**Env vars:**

- `OPENTECH_CLIENT_ID` / `OPENTECH_CLIENT_SECRET` — per-application credentials issued by OpenTech STC Administrators. Shared across all React-PMS companies.
- `OPENTECH_ENV` — `"prod"` (default) or `"dev"`. Swaps the API base hosts: `*.insomniaccia.com` ↔ `*.insomniaccia-dev.com`.
- `GATE_ACCESS_CODE_LENGTH` — number of digits in tenant access codes (default 8 → 100M combinations).
- `GATE_RETRY_BACKOFF_MS` — comma-separated millisecond delays for 5XX retry. Default `"1000,2000,4000"`.

**Per-Company setup (one-time, per OpenTech account):**

1. OpenTech STC Administrators issue API Key + API Secret for the company's account.
2. A System_Admin (or the company's Company_Admin) enters them under Settings → Gate Credentials, which calls `PUT /companies/:companyId/settings/gate`. The secret is write-only: `GET /companies/:companyId/settings/gate` returns only `apiKey` + an `apiSecretSet` flag, and a blank `apiSecret` on PUT preserves the stored value. (Direct `Company.gateProviders.opentech` edits in Mongo still work as a fallback.)

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

### Stripe webhook

`STRIPE_WEBHOOK_SECRET` is the signing secret for the webhook endpoint configured in the Stripe Dashboard. The `/webhooks/stripe` endpoint verifies signatures via `stripe.webhooks.constructEvent`. Currently only `checkout.session.completed` is handled — it transitions Rental `pending -> paid` and writes a `Payment Recieved` Event. See `docs/RENDER.md` for setup steps.

### Admin cron endpoint

`POST /admin/cron/:job` (API-key auth) lets an external scheduler invoke background jobs. Whitelist:

- `delinquency` → `processes/delinquency.js#updateTenantStatus`
- `monthly` → `processes/monthly.js#updateTenantBalance`
- `orphan-cleanup` → `processes/orphanCleanup.js#runOrphanCleanup`

Returns `{ ok, job, durationMs, result }`. See `docs/RENDER.md` for GitHub Actions / Render Cron examples.

### Facility settings

`GET/PUT /facilities/:facilityId/settings` — restricted to System_Admin or same-company Company_Admin via `requireFacilityAdmin.js`.

`Facility.settings` has four groups: `billing` (gracePeriodDays, lateFee.flatAmount, lateFee.percentOfRent, autoSuspendOnDelinquency), `hours`, `contact`, and `general` (timezone, currency).

`PUT` deep-merges at the group level: it loads the existing doc, merges only the supplied groups, runs full schema validation, then saves. Unrelated fields (`amenities`, `unitTypes`, untouched groups) are preserved.

The delinquency job (`processes/delinquency.js`) reads `settings.billing` for per-facility grace period and applies a one-time flat+percent late fee (idempotent via `Rental.lateFeeAppliedAt`, cleared when a rental becomes current). It also respects `autoSuspendOnDelinquency`.

## Don't

- Don't migrate to TypeScript or add a build step.
- Don't introduce a second ORM, query builder, or DI framework.
- Don't change cookie-based auth to header-based without an explicit ask — the client depends on cookies (`withCredentials: true`).
- Don't run destructive Mongo operations from a script without confirming.
- Don't bypass the existing middleware on protected routes.
