# Backend Quality Audit & Comprehensive Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit every endpoint, controller, middleware, service, and background process in `server/`, fix all Critical and High findings, and establish a comprehensive Vitest + mongodb-memory-server + supertest test suite at ≥80% line coverage on server source.

**Architecture:** Split `server/index.js` so the Express app is constructed in a separate `server/app.js` (exported `buildApp()`), enabling supertest to import it without binding a port or connecting to live Mongo. Add a `server/tests/` tree with shared setup/factories/mocks. Audit produces a Markdown document at `docs/superpowers/audits/2026-05-12-backend-quality-audit.md` consumed by later fix tasks. Per-controller phases each ship: audit findings → tests for current behavior → fixes for Critical/High issues → tests that lock the fix.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest (test runner), `mongodb-memory-server` (isolated in-process MongoDB), `supertest` (HTTP-level testing), `@vitest/coverage-v8`. Stripe, DocuSign, and Nodemailer SDKs are stubbed via Vitest module mocks. JWT (`jsonwebtoken`) and `bcrypt` are used real.

**Reference spec:** `docs/superpowers/specs/2026-05-12-backend-quality-audit-and-test-suite-design.md`

---

## Pre-flight: agent rules

Read before starting any task:

- **All paths in this plan are relative to the worktree root** `C:\Users\123\Desktop\Projects\React-PMS\.claude\worktrees\interesting-hofstadter-7b4829\` unless otherwise noted.
- **Never read, log, or commit `server/.env`.** Use env var names only.
- **Don't run `npm install` without explicit user approval.** Task 1.2 pauses for confirmation.
- **ESLint must stay at 0 warnings.** Run `cd server && npm run lint` after every code-touching task.
- **TDD strictly.** Failing test first, run it, confirm it fails, then make it pass.
- **Commit frequently.** Each Step 5 in a task is a real commit.
- **PowerShell is denied.** Use git Bash (`Bash` tool) or built-in Read/Write/Glob/Grep/Edit tools for everything.

---

## File Structure

**New files:**
- `server/app.js` — exports `buildApp()`; constructs Express app without listening.
- `server/tests/setup.js` — global beforeAll/afterAll: mongo-memory-server lifecycle, env defaults.
- `server/tests/helpers/request.js` — supertest agent with `x-api-key` preset.
- `server/tests/helpers/auth.js` — `signJwtCookie(user)`, `loginAs(role, overrides)`.
- `server/tests/helpers/factories.js` — Mongoose document factories per model.
- `server/tests/helpers/docusign.mock.js` — DocuSign module mock factory.
- `server/tests/helpers/stripe.mock.js` — Stripe module mock factory.
- `server/tests/helpers/mailer.mock.js` — Nodemailer module mock factory.
- `server/tests/unit/password.test.js` — bcrypt helper tests.
- `server/tests/unit/models/<entity>.test.js` — one file per Mongoose model.
- `server/tests/middleware/authentication.test.js`
- `server/tests/middleware/apiKeyAuth.test.js`
- `server/tests/services/stripeConnect.test.js`
- `server/tests/services/docusignClient.test.js`
- `server/tests/controllers/<entity>Controller.test.js` — one per controller.
- `server/tests/routes/<entity>Routes.test.js` — one per router.
- `server/tests/processes/delinquency.test.js`
- `server/tests/processes/monthly.test.js`
- `server/vitest.config.js` — Vitest configuration.
- `docs/superpowers/audits/2026-05-12-backend-quality-audit.md` — audit report.

**Modified files:**
- `server/index.js` — now imports `buildApp()`; keeps only `dotenv.config()`, mongoose connect, listen.
- `server/middleware/apiKeyAuth.js` — replace `!==` with `crypto.timingSafeEqual`; remove duplicate `dotenv.config()`.
- `server/middleware/authentication.js` — distinguish expired vs invalid token; correct 401/403.
- `server/package.json` — `scripts.test`, `scripts.test:watch`, `scripts.test:coverage`; add dev deps.
- `server/CLAUDE.md` — replace "no test command" copy with new test workflow.
- `CLAUDE.md` (root) — same.
- Each `server/controllers/<x>Controller.js` — fixes for findings identified in audit (see Phase 3+).

---

## Phase 1 — Test foundation

### Task 1.1: Split `index.js` into `app.js` + `index.js`

**Files:**
- Create: `server/app.js`
- Modify: `server/index.js` (entire file)

- [ ] **Step 1: Read current `server/index.js`** to capture all middleware order, route mounts, and inline endpoints.

- [ ] **Step 2: Create `server/app.js`**

```js
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";

import companyRoutes from "./routes/companyRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import getEnvelopesApi from "./services/docusignClient.js";

export function buildApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, _res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  });

  app.use("/companies", companyRoutes);
  app.use("/facilities", facilityRoutes);
  app.use("/tenants", tenantRoutes);
  app.use("/events", eventRoutes);
  app.use("/payments", paymentRoutes);
  app.use("/rental", rentalRoutes);
  app.use("/", userRoutes);

  app.get("/docusign/ping", async (_req, res) => {
    try {
      const { accountId } = await getEnvelopesApi();
      res.json({ ok: true, accountId });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get("/docusign/envelopes/:envelopeId", async (req, res) => {
    try {
      const { envelopesApi, accountId } = await getEnvelopesApi();
      const env = await envelopesApi.getEnvelope(accountId, req.params.envelopeId, null);
      res.json(env);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}
```

- [ ] **Step 3: Replace `server/index.js`**

```js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildApp } from "./app.js";

dotenv.config();

const app = buildApp();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Database connected");
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🟢 Server is running on port ${port}`));
  })
  .catch((err) => {
    console.error("🔴 Database not connected:", err);
    process.exit(1);
  });
```

- [ ] **Step 4: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 5: Smoke-start the server**

Run (manual, may need a real `.env`): `cd server && npm start`
Expected: `🟢 Database connected` and `🟢 Server is running on port 3000`. Stop with Ctrl-C.
If `.env` is missing, this step is skipped and noted in the commit body.

- [ ] **Step 6: Commit**

```bash
git add server/app.js server/index.js
git commit -m "Refactor: split server/index.js into app.js + index.js for testability"
```

---

### Task 1.2: Approve and install dev dependencies — USER GATE

**Files:** none (dependency change)

- [ ] **Step 1: Pause and ask the user to approve `npm install`.**

Message verbatim to send to the user:

> "About to install: `vitest@^2`, `@vitest/coverage-v8@^2`, `mongodb-memory-server@^10`, `supertest@^7`, all as `devDependencies` under `server/`. This will modify `server/package.json` and `server/package-lock.json`. Approve to proceed?"

Wait for explicit approval.

- [ ] **Step 2: Run install (only after approval)**

Run: `cd server && npm install --save-dev vitest @vitest/coverage-v8 mongodb-memory-server supertest`
Expected: dependencies appear under `devDependencies`; lockfile updates.

- [ ] **Step 3: Update `server/package.json` scripts**

Edit `server/package.json` so `scripts` becomes:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "start": "nodemon index.js",
  "build": "npm i",
  "lint": "eslint . --ext js --report-unused-disable-directives --max-warnings 0"
}
```

- [ ] **Step 4: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "Add test deps: vitest, mongodb-memory-server, supertest, coverage-v8"
```

---

### Task 1.3: Vitest config + global setup

**Files:**
- Create: `server/vitest.config.js`
- Create: `server/tests/setup.js`

- [ ] **Step 1: Create `server/vitest.config.js`**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "controllers/**/*.js",
        "middleware/**/*.js",
        "services/**/*.js",
        "helpers/**/*.js",
        "processes/**/*.js",
      ],
      exclude: ["tests/**", "node_modules/**"],
    },
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

- [ ] **Step 2: Create `server/tests/setup.js`**

```js
import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo;

process.env.API_KEY = process.env.API_KEY || "test-api-key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.EMAIL = process.env.EMAIL || "test@example.com";
process.env.PASS = process.env.PASS || "test-pass";
process.env.STRIPE_SECRET = process.env.STRIPE_SECRET || "sk_test_stub";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_stub";
process.env.DS_ACCOUNT_ID = process.env.DS_ACCOUNT_ID || "test-account";
process.env.DS_BASE_PATH = process.env.DS_BASE_PATH || "https://demo.docusign.net/restapi";
process.env.DS_INTEGRATION_KEY = process.env.DS_INTEGRATION_KEY || "test-integration";
process.env.DS_OAUTH_BASE = process.env.DS_OAUTH_BASE || "account-d.docusign.com";
process.env.DS_PRIVATE_KEY_B = process.env.DS_PRIVATE_KEY_B || "dGVzdC1rZXk=";
process.env.DS_USER_ID = process.env.DS_USER_ID || "test-user";

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
```

- [ ] **Step 3: Smoke-run vitest with no tests yet**

Run: `cd server && npx vitest run --reporter=verbose`
Expected: "No test files found" — no error from setup.

- [ ] **Step 4: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 5: Commit**

```bash
git add server/vitest.config.js server/tests/setup.js
git commit -m "Add vitest config and global test setup with mongodb-memory-server"
```

---

### Task 1.4: First passing test — `helpers/password.js`

**Files:**
- Test: `server/tests/unit/password.test.js`

- [ ] **Step 1: Read `server/helpers/password.js` and list every exported function** (`hashPassword`, `comparePassword`, `passwordValidator`, plus any others).

- [ ] **Step 2: Write the test**

```js
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  passwordValidator,
} from "../../helpers/password.js";

describe("hashPassword", () => {
  it("returns a bcrypt hash string different from the input", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("Sup3rSecret!");
    expect(hash.length).toBeGreaterThan(20);
  });
});

describe("comparePassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(comparePassword("Sup3rSecret!", hash)).resolves.toBe(true);
  });

  it("returns false for the wrong password", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(comparePassword("nope", hash)).resolves.toBe(false);
  });
});

describe("passwordValidator", () => {
  it("accepts a strong password", () => {
    const result = passwordValidator("Sup3rSecret!");
    expect(result).toBeTruthy();
  });

  it("rejects an obviously weak password", () => {
    const result = passwordValidator("abc");
    expect(result).toBeFalsy();
  });
});
```

- [ ] **Step 3: Run the test to see real behavior**

Run: `cd server && npx vitest run tests/unit/password.test.js`
Expected: all four tests pass (these helpers already exist and work). If `passwordValidator` returns a non-boolean shape (e.g., an array of errors), inspect the helper and adjust the test to match the **actual** documented contract — do not change the helper.

- [ ] **Step 4: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 5: Commit**

```bash
git add server/tests/unit/password.test.js
git commit -m "Add password helper tests"
```

---

### Task 1.5: Test helpers — request, auth, factories, mocks

**Files:**
- Create: `server/tests/helpers/request.js`
- Create: `server/tests/helpers/auth.js`
- Create: `server/tests/helpers/factories.js`
- Create: `server/tests/helpers/docusign.mock.js`
- Create: `server/tests/helpers/stripe.mock.js`
- Create: `server/tests/helpers/mailer.mock.js`

- [ ] **Step 1: Create `server/tests/helpers/request.js`**

```js
import supertest from "supertest";

export function api(app) {
  const agent = supertest(app);
  const withKey = (method, url) =>
    agent[method](url).set("x-api-key", process.env.API_KEY);
  return {
    get: (url) => withKey("get", url),
    post: (url) => withKey("post", url),
    put: (url) => withKey("put", url),
    patch: (url) => withKey("patch", url),
    delete: (url) => withKey("delete", url),
    raw: agent,
  };
}
```

- [ ] **Step 2: Create `server/tests/helpers/auth.js`**

```js
import jwt from "jsonwebtoken";

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h", ...options });
}

export function cookieFor(payload, options = {}) {
  return `token=${signJwt(payload, options)}`;
}
```

- [ ] **Step 3: Create `server/tests/helpers/factories.js`**

```js
import mongoose from "mongoose";
import User from "../../models/user.js";
import Company from "../../models/company.js";
import Facility from "../../models/facility.js";
import StorageUnit from "../../models/unit.js";
import Tenant from "../../models/tenant.js";
import Rental from "../../models/rental.js";
import Payment from "../../models/payment.js";

let counter = 0;
const uniq = (prefix) => `${prefix}-${Date.now()}-${++counter}`;

export async function makeCompany(overrides = {}) {
  return Company.create({
    companyName: uniq("Acme"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    ...overrides,
  });
}

export async function makeFacility(company, overrides = {}) {
  return Facility.create({
    company: company._id,
    facilityName: uniq("Facility"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    contactInfo: { phone: "555-0100", email: "f@example.com" },
    ...overrides,
  });
}

export async function makeUnit(facility, overrides = {}) {
  return StorageUnit.create({
    facility: facility._id,
    unitNumber: uniq("U"),
    status: "Vacant",
    specifications: { width: 10, depth: 10, height: 8, unit: "ft" },
    paymentInfo: { pricePerMonth: 100, currency: "USD" },
    ...overrides,
  });
}

export async function makeUser(overrides = {}) {
  return User.create({
    displayName: uniq("user"),
    name: { firstName: "Test", lastName: "User" },
    email: `${uniq("u")}@example.com`,
    role: "System_Admin",
    ...overrides,
  });
}

export async function makeTenant(overrides = {}) {
  return Tenant.create({
    firstName: "Test",
    lastName: "Tenant",
    email: `${uniq("t")}@example.com`,
    phone: "555-0101",
    ...overrides,
  });
}

export async function makeRental(unit, tenant, overrides = {}) {
  return Rental.create({
    unit: unit._id,
    tenant: tenant._id,
    startDate: new Date(),
    status: "Active",
    ...overrides,
  });
}

export async function makePayment(rental, overrides = {}) {
  return Payment.create({
    rental: rental._id,
    amount: 100,
    currency: "USD",
    status: "Succeeded",
    ...overrides,
  });
}

export function oid() {
  return new mongoose.Types.ObjectId().toString();
}
```

**Caveat:** Each factory uses field names based on inspection of the schema during this task. If a Mongoose `required` validation fails when factories are first exercised, read the relevant model file, adjust the factory to match the schema, and document the difference in the audit (Medium severity, "factory required a field the schema marks required").

- [ ] **Step 4: Create `server/tests/helpers/docusign.mock.js`**

```js
import { vi } from "vitest";

export function mockDocusign() {
  vi.mock("../../services/docusignClient.js", () => ({
    default: vi.fn(async () => ({
      accountId: "test-account",
      envelopesApi: {
        createEnvelope: vi.fn(async () => ({ envelopeId: "env-123", status: "sent" })),
        getEnvelope: vi.fn(async () => ({ envelopeId: "env-123", status: "completed" })),
      },
    })),
  }));
}
```

- [ ] **Step 5: Create `server/tests/helpers/stripe.mock.js`**

```js
import { vi } from "vitest";

export function mockStripe(overrides = {}) {
  const defaultImpl = {
    accounts: {
      create: vi.fn(async () => ({ id: "acct_test" })),
      retrieve: vi.fn(async () => ({ id: "acct_test", charges_enabled: true, payouts_enabled: true, requirements: { currently_due: [] } })),
    },
    accountLinks: {
      create: vi.fn(async () => ({ url: "https://stripe.example/onboarding" })),
    },
    accountSessions: {
      create: vi.fn(async () => ({ client_secret: "cs_test" })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ id: "cs_test", url: "https://stripe.example/checkout" })),
      },
    },
    paymentIntents: {
      create: vi.fn(async () => ({ id: "pi_test", client_secret: "pi_test_secret" })),
    },
    ...overrides,
  };
  vi.mock("stripe", () => ({
    default: vi.fn(() => defaultImpl),
  }));
  return defaultImpl;
}
```

- [ ] **Step 6: Create `server/tests/helpers/mailer.mock.js`**

```js
import { vi } from "vitest";

export function mockMailer() {
  const sendMail = vi.fn(async () => ({ messageId: "test-msg" }));
  vi.mock("nodemailer", () => ({
    default: { createTransport: vi.fn(() => ({ sendMail })) },
  }));
  return { sendMail };
}
```

- [ ] **Step 7: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 8: Commit**

```bash
git add server/tests/helpers/
git commit -m "Add shared test helpers: request, auth, factories, mocks"
```

---

### Task 1.6: First middleware test — `apiKeyAuth.js`

**Files:**
- Test: `server/tests/middleware/apiKeyAuth.test.js`

- [ ] **Step 1: Write tests**

```js
import { describe, it, expect } from "vitest";
import express from "express";
import supertest from "supertest";
import authenticateAPIKey from "../../middleware/apiKeyAuth.js";

function appWithMiddleware() {
  const app = express();
  app.get("/protected", authenticateAPIKey, (_req, res) => res.json({ ok: true }));
  return app;
}

describe("authenticateAPIKey", () => {
  it("returns 401 when x-api-key is missing", async () => {
    const res = await supertest(appWithMiddleware()).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/api key/i);
  });

  it("returns 403 when x-api-key is wrong", async () => {
    const res = await supertest(appWithMiddleware())
      .get("/protected")
      .set("x-api-key", "wrong");
    expect(res.status).toBe(403);
  });

  it("calls next() when x-api-key matches", async () => {
    const res = await supertest(appWithMiddleware())
      .get("/protected")
      .set("x-api-key", process.env.API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd server && npx vitest run tests/middleware/apiKeyAuth.test.js`
Expected: all three pass against the current implementation.

- [ ] **Step 3: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 4: Commit**

```bash
git add server/tests/middleware/apiKeyAuth.test.js
git commit -m "Test apiKeyAuth middleware behavior"
```

---

### Task 1.7: First middleware test — `authentication.js`

**Files:**
- Test: `server/tests/middleware/authentication.test.js`

- [ ] **Step 1: Write tests**

```js
import { describe, it, expect } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import supertest from "supertest";
import authenticate from "../../middleware/authentication.js";
import { signJwt } from "../helpers/auth.js";

function app() {
  const a = express();
  a.use(cookieParser());
  a.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
  return a;
}

describe("authenticate middleware", () => {
  it("returns 401 when token cookie is missing", async () => {
    const res = await supertest(app()).get("/me");
    expect(res.status).toBe(401);
  });

  it("returns 403 when token is invalid", async () => {
    const res = await supertest(app()).get("/me").set("Cookie", "token=garbage");
    expect(res.status).toBe(403);
  });

  it("returns 403 when token is expired", async () => {
    const token = signJwt({ sub: "u1" }, { expiresIn: -1 });
    const res = await supertest(app()).get("/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(403);
  });

  it("attaches decoded user and calls next() on valid token", async () => {
    const token = signJwt({ sub: "u1", role: "System_Admin" });
    const res = await supertest(app()).get("/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.sub).toBe("u1");
    expect(res.body.user.role).toBe("System_Admin");
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd server && npx vitest run tests/middleware/authentication.test.js`
Expected: all four pass against the current implementation. (Note: current code returns 403 for any verify error including expired — the audit may later recommend distinguishing 401 expired vs 403 invalid; that's a fix task in Phase 3 that flips this assertion.)

- [ ] **Step 3: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 4: Commit**

```bash
git add server/tests/middleware/authentication.test.js
git commit -m "Test JWT cookie authentication middleware"
```

---

### Task 1.8: First route-level supertest — `/companies` smoke

**Files:**
- Test: `server/tests/routes/companyRoutes.smoke.test.js`

- [ ] **Step 1: Write the test**

```js
import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeUser } from "../helpers/factories.js";

let app;
beforeEach(() => { app = buildApp(); });

describe("GET /companies (smoke)", () => {
  it("401 without api key", async () => {
    const res = await supertest(buildApp()).get("/companies");
    expect(res.status).toBe(401);
  });

  it("401 with api key but no cookie", async () => {
    const res = await api(buildApp()).get("/companies");
    expect(res.status).toBe(401);
  });

  it("200 when both api key and cookie are valid", async () => {
    const user = await makeUser({ role: "System_Admin" });
    await makeCompany();
    const res = await api(buildApp())
      .get("/companies")
      .set("Cookie", cookieFor({ sub: user._id.toString(), role: user.role }));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === "object").toBe(true);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd server && npx vitest run tests/routes/companyRoutes.smoke.test.js`
Expected: all three pass. If the third fails because the controller requires a different request shape (e.g., needs `companyId` in cookie payload), inspect `getCompanies` in `controllers/companyController.js` and adjust the cookie payload — do not change the controller.

- [ ] **Step 3: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 4: Coverage smoke**

Run: `cd server && npm run test:coverage`
Expected: HTML report under `server/coverage/`. Total coverage will be low at this stage — that's fine.

- [ ] **Step 5: Commit**

```bash
git add server/tests/routes/companyRoutes.smoke.test.js
git commit -m "Add smoke test proving supertest + factories + auth helpers work end-to-end"
```

**Foundation complete. Phase 2 is the audit pass; Phase 3+ are per-controller test+fix.**

---

## Phase 2 — Full audit pass

### Task 2.1: Audit the entire `server/` source

**Files:**
- Create: `docs/superpowers/audits/2026-05-12-backend-quality-audit.md`

- [ ] **Step 1: Read every file in the audit surface, in this order.** Use the Read tool — never echo `.env`.

Files to read:
- `server/index.js`, `server/app.js`
- `server/middleware/authentication.js`, `server/middleware/apiKeyAuth.js`
- `server/helpers/password.js`
- `server/services/stripeConnect.js`, `server/services/docusignClient.js`
- `server/controllers/userController.js`
- `server/controllers/companyController.js`
- `server/controllers/facilityController.js`
- `server/controllers/tenantController.js`
- `server/controllers/eventsController.js`
- `server/controllers/paymentController.js`
- `server/controllers/rentalController.js`
- `server/routes/*.js` (all seven)
- `server/models/*.js` (all ten)
- `server/processes/delinquency.js`, `server/processes/monthly.js`

- [ ] **Step 2: For each controller function, apply the rubric** (from the spec's "Audit method" section). Record findings as you go. Use this template per finding:

```markdown
### F-### Title

- **Severity:** Critical | High | Medium | Low
- **File:** `path:line`
- **What:** one-line description.
- **Why it matters:** consequence in production.
- **Fix:** concrete change.
- **Test:** the test (file + name) that will lock the fix in.
```

- [ ] **Step 3: Cross-check route ordering** in each router file by re-reading them and confirming no dynamic route shadows a sibling static path. Particular suspect: `userRoutes.js` `/users/:userId` registered after several `/users/<static>` siblings.

- [ ] **Step 4: Write the audit document** to `docs/superpowers/audits/2026-05-12-backend-quality-audit.md`. Required sections, in order:

```markdown
# Backend Quality Audit — 2026-05-12

## Summary
Total findings: <N> (Critical: <c>, High: <h>, Medium: <m>, Low: <l>).
Top three risks: ...

## Method
(Cite the rubric from the spec.)

## Critical
F-001, F-002, ...

## High
F-101, F-102, ...

## Medium
F-201, ...

## Low
F-301, ...

## Per-file index
| File | Findings |
|---|---|
| controllers/userController.js | F-001, F-005, F-201 |
| ...

## Fix plan
Each Critical and High finding maps to a phase task below:
- F-001 → Task 3.X
- F-002 → Task 3.Y
- ...

## Deferred to follow-up PRs
List of Medium/Low findings not fixed in this PR with rationale.
```

- [ ] **Step 5: Lint passes** (nothing changed in JS land but run as a habit)

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/audits/2026-05-12-backend-quality-audit.md
git commit -m "Add backend quality audit findings"
```

- [ ] **Step 7: Update this plan**

After the audit is committed, edit Phase 3.1–3.7 below so each per-controller task lists:
- the audit findings (F-numbers) it must address,
- the controller functions to test,
- the route(s) to test,
- specific mocks needed (Stripe? DocuSign? Mailer?).

If the audit surfaces a Critical issue that requires a structural change beyond a single-controller fix, add it as a standalone task before its controller's phase. Commit the plan update:

```bash
git add docs/superpowers/plans/2026-05-12-backend-quality-audit-and-test-suite.md
git commit -m "Update plan: per-controller tasks based on audit findings"
```

---

## Phase 3 — Per-controller test + fix template

Each controller gets its own task using the template below. The audit (Task 2.1, Step 7) populates the concrete details. The template is identical in shape — only the controller name, exported functions, routes, and findings change.

### Per-controller task template (do not execute as a task; reference only)

> Replace `<X>` with the controller name (e.g., `user`, `company`, `facility`, `tenant`, `events`, `payment`, `rental`).

**Files:**
- Test: `server/tests/controllers/<X>Controller.test.js`
- Test: `server/tests/routes/<X>Routes.test.js`
- Modify: `server/controllers/<X>Controller.js` (only for Critical/High fixes listed for this controller)
- Audit ref: findings F-### listed in the audit per-file index

- [ ] **Step 1: List every exported function** in `server/controllers/<X>Controller.js`. Copy the list into the test file as a checklist comment at the top:

```js
// Covered functions:
//  - createX
//  - getX
//  - getXById
//  - editX
//  - deleteX
```

- [ ] **Step 2: For each function, write tests covering**

For every exported handler:
1. **Auth fence:** 401 without api key (if route has it), 401 without cookie (if route requires login), 403 with wrong key/expired cookie.
2. **Happy path:** valid request → expected status and JSON shape.
3. **Validation failure:** at least one missing-required-field or bad-`ObjectId` case → expected 4xx + body shape.
4. **Server failure:** mock a model method to throw → expected 5xx (after fix) or 4xx (before fix — locks current behavior).
5. **Side-effect verification (where applicable):** assert email mock called with expected `to`/`subject`, assert Stripe mock called with expected args, assert DocuSign mock called with expected envelope shape.

Example shape (for a `createX` handler):

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

describe("POST /<base>/create — createX", () => {
  let app, adminCookie;

  beforeEach(async () => {
    app = buildApp();
    const admin = await makeUser({ role: "System_Admin" });
    adminCookie = cookieFor({ sub: admin._id.toString(), role: admin.role });
  });

  it("rejects missing api key", async () => {
    const res = await supertest(app).post("/<base>/create").send({ /* minimal body */ });
    expect(res.status).toBe(401);
  });

  it("rejects missing cookie", async () => {
    const res = await api(app).post("/<base>/create").send({ /* minimal body */ });
    expect(res.status).toBe(401);
  });

  it("creates the resource on valid input", async () => {
    const body = { /* concrete valid body — derived from controller's req.body destructuring */ };
    const res = await api(app).post("/<base>/create").set("Cookie", adminCookie).send(body);
    expect(res.status).toBe(201); // adjust if controller currently returns 200 and audit deferred the fix
    expect(res.body).toMatchObject({ /* expected shape */ });
  });

  it("400s on missing required field", async () => {
    const res = await api(app).post("/<base>/create").set("Cookie", adminCookie).send({ /* incomplete */ });
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toBeTruthy();
  });

  it("500s when the database throws", async () => {
    const Model = (await import("../../models/<x>.js")).default;
    const spy = vi.spyOn(Model, "create").mockRejectedValueOnce(new Error("db down"));
    const res = await api(app).post("/<base>/create").set("Cookie", adminCookie).send({ /* valid */ });
    expect(res.status).toBe(500); // before fix this may be 400 — start as `expect(res.status).toBe(400)` and flip when the fix lands
    spy.mockRestore();
  });
});
```

- [ ] **Step 3: Run the tests; record which fail because of audit findings**

Run: `cd server && npx vitest run tests/controllers/<X>Controller.test.js tests/routes/<X>Routes.test.js`
Expected: tests that document **current** behavior pass. Tests that assert **post-fix** behavior are written with current-behavior assertions plus a `// TODO F-### — flip when fix lands` comment.

- [ ] **Step 4: Apply Critical and High fixes for this controller**

For each F-### finding mapped to this controller in the audit:
1. Re-read the finding.
2. Apply the exact fix described in the audit.
3. Flip the relevant test assertion from current behavior to corrected behavior.
4. Re-run.

Common fix patterns:

- **Wrong status (400 instead of 500):**
  ```js
  // before
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  // after
  } catch (error) {
    console.error("Error in <X>.<fn>:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
  ```

- **Missing authorization scope (user can read resources outside their company):**
  ```js
  // add to query
  const query = { _id: id, company: req.user.company };
  ```

- **Per-request transport construction (Nodemailer/Stripe instance built inside handler):** extract to a module-scope singleton **only if** the audit identifies the pattern in >2 handlers; otherwise leave and note for a follow-up PR (per the spec's "no unrelated refactoring" rule).

- [ ] **Step 5: Run the full server test suite, not just this controller**

Run: `cd server && npm test`
Expected: all tests pass. Coverage report shows progress.

- [ ] **Step 6: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 7: Commit**

```bash
git add server/tests/controllers/<X>Controller.test.js \
        server/tests/routes/<X>Routes.test.js \
        server/controllers/<X>Controller.js
git commit -m "Test and fix <X> controller (audit findings F-###, F-###, ...)"
```

---

### Task 3.1: Apply template to `userController.js` + `userRoutes.js`

Apply the per-controller template. Specifics:

- Functions to cover: `createUser`, `getUsers`, `getUsersByCompany`, `getUserById`, `editUser`, `deleteUser`, `selectFacility`, `clearSelectedFacility`, `setUserPassword`, `userConfirmationEmail`, `sendUserConfirmationEmail`, `loginUser`, `logoutUser`, `getLoginData`, `getDashboardData`, `rentalCenterCompany`, `rentalCenterFacilities`, `rentalCenterUnits`, `rentalCenterConfig`.
- Mocks required: `mailer.mock.js` (confirmation email path).
- Special attention: route ordering risk — `GET /users/:userId` registered after `GET /users/confirm/:userId`, `GET /users/company/:companyId`. The supertest cases must include a test that confirms `GET /users/confirm/<id>` is **not** dispatched to `getUserById`. This is a regression guard for a likely finding.
- Audit findings will be filled in by Task 2.1 Step 7.

### Task 3.2: Apply template to `companyController.js` + `companyRoutes.js`

- Functions: `getCompanies`, `getCompanyById`, `getFacilitiesByCompany`, `createCompany`, `editCompany`, `deleteCompany`, `createStripeAccountLink`, `syncStripeAccountRequirements`, `getStripeDashboardLink`, `getCompanyStripeSettings`, `createCheckoutSession`.
- Mocks required: `stripe.mock.js`.
- Side effects to assert: Stripe `accounts.create`, `accountLinks.create`, `accounts.retrieve`, `checkout.sessions.create` called with company-scoped arguments.

### Task 3.3: Apply template to `facilityController.js` + `facilityRoutes.js`

- Functions: `getFacilities`, `getFacilitiesAndCompany`, `getFacilityById`, `getFacilityDashboardData`, `createFacility`, `editFacility`, `deleteFacility`, `deployFacility`, `getAmenities`, `getSecurityLevels`, `addUnitType`, `deleteUnitType`, `editUnitType`, `addAmenity`, `deleteAmenity`, `editAmenity`, `addUnit`, `editUnit`, `deleteUnit`, `getUnits`, `getUnitById`, `getVacantUnits`, `createNote`, `editNote`, `removeTenant`.
- No external service mocks needed.

### Task 3.4: Apply template to `tenantController.js` + `tenantRoutes.js`

- Functions: `createTenant`, `getTenants`, `getTenantById`, `editTenant`, `deleteTenant`, `addUnitToTenant`.
- Note: `createTenant` and friends are mounted under **both** `/tenants` and `/facilities/:facilityId/tenants`. Tests must exercise both prefixes.
- Mocks required: `mailer.mock.js` if a confirmation email path exists.

### Task 3.5: Apply template to `eventsController.js` + `eventRoutes.js`

- Functions: `getAllEvents`, `getApplicationEventsByFacility`.
- README flags `Facility Application Events report errors on API call` — likely a Critical or High finding; the test that reproduces this **must** be written first, fail, then pass after the fix.

### Task 3.6: Apply template to `paymentController.js` + `paymentRoutes.js`

- Functions: `createPayment`, `createUnitCheckoutSession`.
- Mocks required: `stripe.mock.js`.

### Task 3.7: Apply template to `rentalController.js` + `rentalRoutes.js`

- Functions: `getCompanies`, `getCompanyDataById`, `getFacilitiesLowestRate`, `getFacilityDataById`, `getUnitDataById`, `createTenantAndLease`, `loginTenantAndCreateLease`.
- Mocks required: `docusign.mock.js`, `mailer.mock.js`, `stripe.mock.js` (if checkout is part of the lease flow).
- Important: `createTenantAndLease` is the multi-step public rental flow. Tests must cover partial failure: tenant created but DocuSign envelope creation fails → assert that the system either rolls back or surfaces the partial state coherently. README flags multi-unit-creation partial-failure as a known bug; the rental flow may have an analogous issue.

---

## Phase 4 — Service, model, middleware, and process tests

### Task 4.1: Services

**Files:**
- Test: `server/tests/services/stripeConnect.test.js`
- Test: `server/tests/services/docusignClient.test.js`

- [ ] **Step 1: Write `stripeConnect.test.js`**

```js
import { describe, it, expect, vi } from "vitest";

describe("stripeConnect", () => {
  it("constructs the Stripe client using STRIPE_SECRET", async () => {
    const stripeConstructor = vi.fn(() => ({ accounts: {}, checkout: {} }));
    vi.doMock("stripe", () => ({ default: stripeConstructor }));
    await import("../../services/stripeConnect.js");
    expect(stripeConstructor).toHaveBeenCalled();
    const arg = stripeConstructor.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg.length).toBeGreaterThan(0);
  });
});
```

Note: actual assertions depend on what `stripeConnect.js` exports. Adjust to its real surface during Task 2.1 audit, then write tests matching.

- [ ] **Step 2: Write `docusignClient.test.js`** following the same pattern: stub `docusign-esign`, import the module, assert client wiring.

- [ ] **Step 3: Run + lint + commit**

```bash
cd server && npm test
cd server && npm run lint
git add server/tests/services/
git commit -m "Test Stripe and DocuSign service wrappers"
```

### Task 4.2: Models

**Files:**
- Test: `server/tests/unit/models/<entity>.test.js` — one per model.

- [ ] **Step 1: For each model file, write a test file** that covers:

  1. Required fields rejected when missing (assert Mongoose `ValidationError`).
  2. Defaults applied when not provided.
  3. Enum fields reject invalid values.
  4. Refs validate when populated with non-existent IDs (where the schema declares `ref`).
  5. Pre-save hooks (if any) run.

Example for `user.js`:

```js
import { describe, it, expect } from "vitest";
import User from "../../../models/user.js";

describe("User model", () => {
  it("requires email", async () => {
    await expect(User.create({ displayName: "x" })).rejects.toThrow(/email/i);
  });

  it("rejects an unknown role", async () => {
    await expect(
      User.create({ displayName: "x", email: "x@y.z", role: "Galactic_Overlord" })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run + lint + commit per model file** (one commit per model is fine and keeps history readable).

### Task 4.3: Processes

**Files:**
- Test: `server/tests/processes/delinquency.test.js`
- Test: `server/tests/processes/monthly.test.js`

- [ ] **Step 1: Read both process files.** If they call `setInterval` at module import time, the audit must flag this and they must be refactored to export a callable function before they can be tested deterministically. Apply the audit fix in this task.

- [ ] **Step 2: Write tests** that:

  1. Seed the database with fixtures (some delinquent rentals, some current).
  2. Invoke the exported function.
  3. Assert side effects (status updates on rentals, events created, mailer called).

- [ ] **Step 3: Run + lint + commit.**

---

## Phase 5 — Coverage gate + documentation

### Task 5.1: Enforce coverage threshold

**Files:**
- Modify: `server/vitest.config.js`

- [ ] **Step 1: Re-run coverage** to see current numbers

Run: `cd server && npm run test:coverage`
Expected: report printed.

- [ ] **Step 2: Add the threshold** to `vitest.config.js`

```js
coverage: {
  // existing fields...
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 70,
    statements: 80,
  },
},
```

- [ ] **Step 3: Re-run** and fix any controller still below 80% by adding the missing-case tests.

Run: `cd server && npm run test:coverage`
Expected: passes thresholds.

- [ ] **Step 4: Commit**

```bash
git add server/vitest.config.js
git commit -m "Enforce >=80% line/function/statement and >=70% branch coverage on server"
```

### Task 5.2: Documentation

**Files:**
- Modify: `server/CLAUDE.md`
- Modify: `CLAUDE.md` (root)

- [ ] **Step 1: Update `server/CLAUDE.md`.** Replace the "No test command" stanza with:

```markdown
## Tests

Vitest + mongodb-memory-server + supertest. Mocks for Stripe, DocuSign, Nodemailer.

- Run once: `npm test`
- Watch: `npm run test:watch`
- Coverage (must pass thresholds in `vitest.config.js`): `npm run test:coverage`

Tests live under `server/tests/` mirroring source layout (`controllers/`, `routes/`, `middleware/`, `services/`, `unit/models/`, `processes/`). Shared helpers in `tests/helpers/`. Global setup in `tests/setup.js` starts an in-memory MongoDB once per worker and drops collections between tests.

When adding a new endpoint:
1. Add controller test in `tests/controllers/<x>Controller.test.js`.
2. Add a thin route test in `tests/routes/<x>Routes.test.js` proving both auth fences fire.
3. Use factories from `tests/helpers/factories.js`; add new factories there.
```

- [ ] **Step 2: Update root `CLAUDE.md`.** Replace `There is no test suite. Do not invent a npm test command — server's test script intentionally errors.` with:

```markdown
There is a Vitest test suite on the server: `cd server && npm test`. There is still no client-side test suite.
```

- [ ] **Step 3: Lint passes**

Run: `cd server && npm run lint`
Expected: `0 problems`.

- [ ] **Step 4: Commit**

```bash
git add server/CLAUDE.md CLAUDE.md
git commit -m "Document Vitest test workflow in CLAUDE.md files"
```

### Task 5.3: Final verification

- [ ] **Step 1: Run everything from a clean state**

```bash
cd server && rm -rf coverage
cd server && npm run lint
cd server && npm test
cd server && npm run test:coverage
```

Expected:
- Lint: 0 problems.
- Tests: all pass.
- Coverage: passes thresholds.

- [ ] **Step 2: Smoke-start the real server** (requires a real `server/.env` — skip if not available and note in the PR).

Run: `cd server && npm start`
Expected: `🟢 Database connected` and `🟢 Server is running on port 3000`. Ctrl-C.

- [ ] **Step 3: Confirm acceptance criteria from spec.** Walk the checklist in `docs/superpowers/specs/2026-05-12-backend-quality-audit-and-test-suite-design.md` and tick each.

- [ ] **Step 4: No commit** — this task is verification only.

---

## Self-review (executed by the plan author, complete)

**Spec coverage:**
- Audit: Phase 2 ✓
- Test foundation: Phase 1 ✓
- Fixes for Critical/High findings: Phase 3 per-controller tasks + Task 4.3 (process audit fixes) ✓
- `app.js` / `index.js` split: Task 1.1 ✓
- Vitest + mongodb-memory-server + supertest + coverage-v8: Task 1.2–1.3 ✓
- Mocks for Stripe/DocuSign/Nodemailer: Task 1.5 ✓
- Coverage ≥ 80%: Task 5.1 ✓
- CLAUDE.md updates: Task 5.2 ✓
- No `.env` read: explicit in Pre-flight rules ✓
- `npm install` gated on user approval: Task 1.2 Step 1 ✓
- Lint at 0 warnings throughout: every task has a lint step ✓

**Placeholders:** Phase 3.1–3.7 reference findings F-### filled in by Task 2.1 Step 7. The plan explicitly designates Task 2.1 Step 7 to fill them in; this is a deferred-by-design step, not a placeholder failure.

**Type consistency:** Helper names are stable across tasks (`api`, `cookieFor`, `signJwt`, `makeUser`, `makeCompany`, `oid`). `buildApp` consistent. Mock factory names consistent.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-12-backend-quality-audit-and-test-suite.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session, batch execution with checkpoints.

Which approach?
