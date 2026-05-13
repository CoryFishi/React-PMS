# Backend Quality Audit & Comprehensive Test Suite

**Date:** 2026-05-12
**Project:** React-PMS — `server/`
**Approach:** A (full audit + full test suite)

## Goal

Bring the Express + Mongoose backend to a verifiable quality baseline by:

1. Auditing every controller, route, model, middleware, service, helper, and background process for correctness, security, and consistency.
2. Fixing the findings — bugs, wrong status codes, route ordering risks, timing-vulnerable comparisons, missing authorization checks, inconsistent responses, dead code.
3. Standing up a comprehensive automated test suite that covers happy path + meaningful error paths for every controller function and every route.

Success means a future contributor can change any server file and know within seconds whether they broke something.

## Non-goals

- No TypeScript migration (forbidden by `server/CLAUDE.md`).
- No swap of Express, Mongoose, JWT-in-cookie, or the API-key middleware design.
- No new ORM, DI framework, or validation library unless the audit identifies a critical need and the user approves it explicitly.
- No client-side changes. If a server contract change is needed to fix a bug, the spec calls it out and the work is gated on user approval.
- No DocuSign or Stripe live calls in tests — both are mocked.

## Constraints & guardrails (from project CLAUDE.md)

- `npm install` requires explicit user approval before running.
- ESLint must stay at `--max-warnings 0`.
- Cookie-based auth must not be replaced with header-based auth.
- ESLint config stays in `package.json` `eslintConfig` (no `.eslintrc.*`).
- Don't introduce TypeScript or a build step.
- Don't read or echo `.env`.
- Server uses ESM only; relative imports include `.js` extension.

## Inventory (work surface)

**Routes (7):** `companyRoutes`, `facilityRoutes`, `tenantRoutes`, `eventRoutes`, `paymentRoutes`, `rentalRoutes`, `userRoutes`.

**Controllers (7):** matching set under `controllers/`.

**Models (10):** `company`, `event`, `facility`, `payment`, `rental`, `role`, `tenant`, `unit`, `unitType`, `user`.

**Middleware (2):** `authentication.js` (JWT cookie), `apiKeyAuth.js` (header).

**Services (2):** `stripeConnect.js`, `docusignClient.js`.

**Helpers (1):** `password.js` (bcrypt + validator).

**Processes (2):** `delinquency.js`, `monthly.js`.

**Entry point:** `index.js` (plus two inline DocuSign debug endpoints).

## Deliverables

### Deliverable 1 — Written audit

A single Markdown file: `docs/superpowers/audits/2026-05-12-backend-quality-audit.md`.

Structure:

- **Critical** — security/correctness failures (auth bypass, missing authorization, timing attacks, broken JWT handling, SSRF, unsafe queries).
- **High** — incorrect behavior (wrong HTTP status, swallowed errors, missing error paths, route ordering that can shadow other handlers, broken business invariants).
- **Medium** — consistency and maintainability (inconsistent response envelopes, mixed route naming, missing input validation, per-request transport construction, duplicated `dotenv.config()` calls, dead code).
- **Low** — style and naming.

Every finding lists: file:line, what it is, why it matters, the chosen fix, and a test that will be written to lock the fix in.

### Deliverable 2 — Comprehensive test suite

**Runner:** Vitest (ESM-native, fast, no Babel).

**Database:** `mongodb-memory-server` started once per test process; each test suite gets an isolated database name; collections are dropped between tests within a suite.

**HTTP:** `supertest` against the Express app. `index.js` is split so `app` is constructed and exported by `server/app.js`, and `index.js` becomes the listen/connect entry — this is the only structural refactor the test foundation requires.

**Mocks:**
- Stripe SDK — Vitest module mock returning deterministic fixtures.
- DocuSign client — module mock returning a fake `envelopesApi` and `accountId`.
- Nodemailer — `createTransport` mocked; assertions check `sendMail` arguments.
- `jsonwebtoken` — real, not mocked. Tests use a test `JWT_SECRET`.
- `bcrypt` — real. Acceptable speed at the suite size we are building.

**Layout:**

```
server/
  app.js                              ← new: builds and returns the Express app
  index.js                            ← keeps connect + listen; imports app
  tests/
    setup.js                          ← global setup: env defaults, mongo lifecycle
    helpers/
      request.js                      ← supertest agent with x-api-key preset
      auth.js                         ← helpers: signCookie(user), loginAs(role)
      factories.js                    ← user/company/facility/unit/tenant/rental/payment
      docusign.mock.js                ← module mock impl
      stripe.mock.js                  ← module mock impl
      mailer.mock.js                  ← module mock impl
    unit/
      password.test.js                ← hashPassword, comparePassword, passwordValidator
      models/
        user.test.js                  ← schema validation, defaults, indexes
        company.test.js
        facility.test.js
        unit.test.js
        unitType.test.js
        rental.test.js
        tenant.test.js
        payment.test.js
        event.test.js
        role.test.js
    middleware/
      authentication.test.js          ← missing cookie, invalid, expired, valid
      apiKeyAuth.test.js              ← missing header, wrong key, correct key
    services/
      stripeConnect.test.js           ← wrapper behavior with mocked SDK
      docusignClient.test.js          ← wrapper behavior with mocked SDK
    controllers/
      userController.test.js          ← all exported functions
      companyController.test.js
      facilityController.test.js
      tenantController.test.js
      eventsController.test.js
      paymentController.test.js
      rentalController.test.js
    routes/
      userRoutes.test.js              ← end-to-end per route
      companyRoutes.test.js
      facilityRoutes.test.js
      tenantRoutes.test.js
      eventRoutes.test.js
      paymentRoutes.test.js
      rentalRoutes.test.js
    processes/
      delinquency.test.js
      monthly.test.js
```

**Coverage target:** every exported function in `controllers/`, `middleware/`, `services/`, `helpers/`, and `processes/` is exercised with at least one happy-path test and one meaningful error/edge-case test. Every route registered in `index.js` has at least one supertest test that hits it through both middleware layers.

**`package.json` changes:**
- `scripts.test` becomes `vitest run`.
- Add `scripts.test:watch` → `vitest`.
- Add `scripts.test:coverage` → `vitest run --coverage`.
- Add devDependencies: `vitest`, `mongodb-memory-server`, `supertest`, `@vitest/coverage-v8`.

### Deliverable 3 — Bug fixes from the audit

Each Critical and High finding is fixed in this PR. Each fix lands with the test(s) that would have caught it. Medium and Low findings are fixed only when the change is mechanical and risk-free (e.g., status code corrections, deduping `dotenv.config()`); the rest are documented in the audit as follow-up work so the PR remains reviewable.

A bug fix in a controller must not change the response shape that the client depends on. When a fix would change the response shape (e.g., a controller returning `400` for a server error needs to return `500`), the spec lists it and the implementer verifies the client doesn't branch on the old code before changing it.

## Architecture changes

Minimal. The only structural change is splitting `index.js` so the Express app can be constructed without binding a port or connecting to Mongo:

```js
// server/app.js
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
// ...other route imports
import getEnvelopesApi from "./services/docusignClient.js";

export function buildApp() {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req, _res, next) => { console.log(`Incoming request: ${req.method} ${req.url}`); next(); });

  app.use("/companies", companyRoutes);
  app.use("/facilities", facilityRoutes);
  app.use("/tenants", tenantRoutes);
  app.use("/events", eventRoutes);
  app.use("/payments", paymentRoutes);
  app.use("/rental", rentalRoutes);
  app.use("/", userRoutes);

  // existing inline docusign debug endpoints stay here
  app.get("/docusign/ping", /* ... */);
  app.get("/docusign/envelopes/:envelopeId", /* ... */);

  return app;
}
```

```js
// server/index.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildApp } from "./app.js";

dotenv.config();
const app = buildApp();

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Database connected");
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🟢 Server is running on port ${port}`));
  })
  .catch((err) => { console.error("🔴 Database not connected:", err); process.exit(1); });
```

No other architectural changes. Controllers, routes, models, middleware, services keep their current shape.

## Audit method (HOW the review is done)

For each controller file in turn:

1. Read top-to-bottom. List every exported function.
2. For each function, write down:
   - **Inputs** — `req.params`, `req.body`, `req.query`, `req.cookies`, `req.headers`, `req.user`.
   - **Side effects** — DB writes, external API calls, emails, cookie writes.
   - **Outputs** — status code(s), JSON shape(s).
3. Check against a fixed rubric:
   - Authorization: does this require login? Does it require ownership of the resource (e.g., user must belong to the company they're acting on)? Is that check present?
   - Status codes: is `400` correct, or should this be `401`, `403`, `404`, `409`, `500`?
   - Error handling: are unexpected errors logged? Is the user-facing message safe (no stack traces, no DB internals)?
   - Input shape: are required fields checked? Are types coerced safely (`ObjectId`, numbers, dates)? Are unknown fields ignored?
   - Mongo: are queries scoped to the user's company/facility where applicable? Any `findOneAndUpdate` without `runValidators`? Any unbounded `.find()` returning huge sets?
   - Concurrency: any read-modify-write that should be atomic?
   - Side effects: are emails/Stripe calls idempotent under retry? Are they inside or outside the response path in a way that can leave inconsistent state?
4. Cross-route check:
   - Route ordering in each router file — does any dynamic segment shadow a sibling static path?
   - Method/path naming consistency — flag (do not necessarily fix) routes that diverge from `/resource` REST conventions.
5. Middleware:
   - `apiKeyAuth.js`: switch `!==` to `crypto.timingSafeEqual` against equal-length buffers; remove the duplicate `dotenv.config()` (already called in `index.js`).
   - `authentication.js`: confirm `jwt.verify` error handling distinguishes expired (`TokenExpiredError`) from invalid; return `401` vs `403` correctly.
6. Services:
   - `stripeConnect.js` and `docusignClient.js` — confirm they fail loudly on missing env vars, don't log secrets, and surface SDK errors with enough context to debug.
7. Processes:
   - `delinquency.js`, `monthly.js` — confirm they can be invoked deterministically from a test (no `setInterval` at import time) and that re-running on the same day is safe.

## Data flow (test side)

```
Vitest worker
  └── setup.js
        ├── starts mongodb-memory-server (singleton per worker)
        ├── mongoose.connect to memory URI
        ├── seeds API_KEY, JWT_SECRET, FRONTEND_URL, stripe/docusign keys
        └── afterAll: disconnect + stop memory server

  └── test file
        ├── beforeEach: drop all collections
        ├── factories.createCompany({...}) → real Mongo doc
        ├── helpers.loginAs(user) → returns signed JWT cookie
        ├── request(app).get("/...").set("Cookie", cookie).set("x-api-key", KEY)
        └── assert status + JSON shape
```

## Error handling

Tests assert on three categories:

1. **Auth failures:** missing API key (401), wrong API key (403), missing cookie (401), invalid cookie (403), expired cookie (401).
2. **Validation failures:** missing required fields, malformed `ObjectId`, role mismatches — assert the correct 4xx status and a `message`/`error` field on the body.
3. **Server failures:** simulated by mocking a model method to throw — assert 500 (after the audit fix; the current code returns 400 here, which is one of the fixes).

For controllers that send email or call Stripe/DocuSign, the test asserts the mock was called with the right arguments and that a failure in the mock surfaces correctly to the client.

## Risks

- **Time:** Approach A is large. Estimated 3-5 working days for the audit pass, 5-8 for tests + fixes. Mitigation: order work by route (controller + tests + fixes together) so the PR has natural checkpoints; the spec is reviewable independently from the implementation.
- **Hidden client coupling:** A status-code fix can break a client `if (err.response.status === 400)` branch. Mitigation: before any response-shape or status change, `grep` the client for the old code and document the impact.
- **Test flakiness from `mongodb-memory-server`:** rare but possible on Windows. Mitigation: pin the version; warm the binary in setup; allow CI retries on memory-server startup only.
- **External SDK behavior drift:** mocks may not match real Stripe/DocuSign behavior. Mitigation: keep mocks shallow — assert call shape, not response shape; integration tests against real sandboxes are out of scope.
- **Background processes touching live data:** `delinquency.js` and `monthly.js` may already run on import in production. The audit confirms or refutes this; the test wraps them in a callable export if needed.

## Acceptance criteria

- [ ] `docs/superpowers/audits/2026-05-12-backend-quality-audit.md` exists, covers every controller/route/middleware/service/process, and classifies findings.
- [ ] Every Critical and High finding has a fix and a test in this PR, or is explicitly listed as deferred with justification.
- [ ] `server/app.js` exists; `server/index.js` uses it; both still start cleanly with `npm start`.
- [ ] `cd server && npm run lint` exits 0 with no warnings.
- [ ] `cd server && npm test` exits 0.
- [ ] `cd server && npm run test:coverage` reports ≥ 80% line coverage on `controllers/`, `middleware/`, `services/`, `helpers/`, `processes/`.
- [ ] `server/CLAUDE.md` and root `CLAUDE.md` updated to document the test workflow (replacing "There is no test suite").
- [ ] No `.env` file was read, logged, or modified.
- [ ] No client-side files were modified except where an audit fix forced a contract change, and that change is called out in the PR description.

## Open decisions deferred to implementation

- Exact Vitest version (latest 2.x at time of install).
- Whether to add `eslint-plugin-vitest` (probably yes; trivial; ask before installing).
- Whether to add a tiny validation helper (single internal function) for request bodies, or just keep manual checks. Default: manual checks unless the audit shows the same pattern repeated >5 times.

## Next step

Hand off to the `superpowers:writing-plans` skill to produce a stepwise implementation plan with checkpoints.
