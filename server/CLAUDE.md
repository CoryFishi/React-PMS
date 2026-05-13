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
- Stripe: `STRIPE_SECRET`, `STRIPE_SECRET_KEY`
- DocuSign: `DS_ACCOUNT_ID`, `DS_BASE_PATH`, `DS_INTEGRATION_KEY`, `DS_OAUTH_BASE`, `DS_PRIVATE_KEY_B64`, `DS_USER_ID`. Legacy `DS_PRIVATE_KEY_B` is still read with a deprecation warning.

If a feature needs a new env var, add it here and document it in the root `CLAUDE.md`.

## Don't

- Don't migrate to TypeScript or add a build step.
- Don't introduce a second ORM, query builder, or DI framework.
- Don't change cookie-based auth to header-based without an explicit ask — the client depends on cookies (`withCredentials: true`).
- Don't run destructive Mongo operations from a script without confirming.
- Don't bypass the existing middleware on protected routes.
