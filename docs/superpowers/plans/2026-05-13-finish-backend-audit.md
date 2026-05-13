# Finish the Backend Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the 15 remaining findings from the 2026-05-12 backend audit through 5 themed PRs, each with regression tests.

**Architecture:** No architectural change. Every task is a localized fix (route, controller, middleware, or service) following the existing route+controller+model layout. Each finding gets a failing Vitest test first, then the minimal fix.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + mongodb-memory-server + supertest, existing helpers in `server/tests/helpers/` (`factories.js`, `auth.js`, `request.js`, `stripe.mock.js`, `mailer.mock.js`, `docusign.mock.js`).

**Source spec:** [docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md](../specs/2026-05-13-finish-backend-audit-design.md)
**Source audit:** [docs/superpowers/audits/2026-05-12-backend-quality-audit.md](../audits/2026-05-12-backend-quality-audit.md)

## File map

Files added (all under `server/tests/`):
- `controllers/companyController.stripeOrphan.test.js`
- `controllers/facilityController.runValidators.test.js`
- `controllers/userController.createUserEmailFailure.test.js`
- `controllers/userController.resendConfirmation.test.js`
- `controllers/userController.createUserNoFacilities.test.js`
- `controllers/userController.brandName.test.js`
- `controllers/companyController.stripeRedirectUrl.test.js`
- `controllers/facilityController.editNote.test.js`
- `routes/companyRoutes.ordering.test.js`
- `routes/rentalRoutes.ordering.test.js`
- `middleware/apiKeyAuth.timingSafe.test.js`
- `middleware/authentication.expiredVsInvalid.test.js`
- `services/docusignClient.envWarning.test.js`
- `controllers/facilityController.getFacilitiesScoped.test.js`

Files modified:
- `server/controllers/companyController.js` — `createCompany` Stripe orphan cleanup, `createStripeAccountLink` FRONTEND_URL
- `server/controllers/facilityController.js` — `editFacility`/`deployFacility` runValidators, `editNote` try/catch, `getFacilities` scoping
- `server/controllers/userController.js` — `createUser` await sendMail, `createUser` facilities null guard, `sendUserConfirmationEmail` no unconditional unset, both confirmation handlers brand name
- `server/routes/companyRoutes.js` — reorder static before dynamic
- `server/routes/rentalRoutes.js` — reorder specific before general
- `server/middleware/apiKeyAuth.js` — drop dotenv, timingSafeEqual
- `server/middleware/authentication.js` — 401 vs 403 by error name
- `server/services/docusignClient.js` — DS_PRIVATE_KEY_B64 with fallback + warning
- `CLAUDE.md`, `server/CLAUDE.md` — env var name updates for F-207

---

## Pre-flight (run once)

- [ ] **Step P1: Confirm baseline tests pass**

Run: `cd server && npm test`
Expected: All existing tests pass (suite green).

If anything fails on baseline, stop and report before touching code.

---

# PR 1 — Stripe orphan accounts and validator gaps

Findings: F-105, F-304

## Task 1: F-105 — Stripe orphan cleanup on Mongo failure

**Files:**
- Create: `server/tests/controllers/companyController.stripeOrphan.test.js`
- Modify: `server/controllers/companyController.js` (the `createCompany` function, lines ~11–54)

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/companyController.stripeOrphan.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";
import Company from "../../models/company.js";

const accountsCreate = vi.fn();
const accountsDel = vi.fn();
vi.mock("stripe", () => ({
  default: () => ({
    accounts: { create: accountsCreate, del: accountsDel },
  }),
}));

let app, adminCookie;

beforeEach(async () => {
  accountsCreate.mockReset();
  accountsDel.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /companies/create — F-105 Stripe orphan cleanup", () => {
  it("calls stripe.accounts.del when Mongo insert fails on duplicate companyName", async () => {
    accountsCreate.mockResolvedValue({ id: "acct_orphan_123" });

    const existing = await makeCompany({ companyName: "Duplicate Inc" });

    const res = await api(app)
      .post("/companies/create")
      .set("Cookie", adminCookie)
      .send({
        companyName: existing.companyName,
        address: { street1: "1 X", city: "Y", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { email: "x@example.com" },
      });

    expect(res.status).toBe(409);
    expect(accountsDel).toHaveBeenCalledWith("acct_orphan_123");

    const all = await Company.find({ companyName: existing.companyName });
    expect(all).toHaveLength(1);
    expect(all[0]._id.toString()).toBe(existing._id.toString());
  });

  it("does not call stripe.accounts.del on success", async () => {
    accountsCreate.mockResolvedValue({ id: "acct_happy_path" });

    const res = await api(app)
      .post("/companies/create")
      .set("Cookie", adminCookie)
      .send({
        companyName: "Brand New Co",
        address: { street1: "1 X", city: "Y", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { email: "x@example.com" },
      });

    expect(res.status).toBe(201);
    expect(accountsDel).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/controllers/companyController.stripeOrphan.test.js`
Expected: The duplicate-key test FAILS because `accountsDel` is never called.

- [ ] **Step 3: Apply the fix in `companyController.js`**

Replace `createCompany`:

```js
export const createCompany = async (req, res) => {
  let stripeAccount;
  try {
    stripeAccount = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: req.body.contactInfo?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const companyWithStripe = {
      ...req.body,
      stripe: {
        accountId: stripeAccount.id,
        onboardingComplete: false,
      },
    };

    const newCompany = await Company.create(companyWithStripe);
    return res.status(201).json(newCompany);
  } catch (error) {
    if (stripeAccount?.id) {
      try {
        await stripe.accounts.del(stripeAccount.id);
      } catch (cleanupErr) {
        console.error(
          "Failed to delete orphan Stripe account " + stripeAccount.id + ":",
          cleanupErr.message
        );
      }
    }

    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error("Rejecting due to validation error: " + error.errors[firstErrorKey].message);
      return res.status(500).send({ error: error.errors[firstErrorKey].message });
    }
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      return res.status(409).send({ error: `${duplicateValue} is already taken!` });
    }
    console.error("Rejecting due to unknown error: " + error.name);
    return res.status(500).send({ error: error.name });
  }
};
```

- [ ] **Step 4: Run tests**

Run: `cd server && npx vitest run tests/controllers/companyController`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add server/controllers/companyController.js server/tests/controllers/companyController.stripeOrphan.test.js
git commit -m "Fix F-105: roll back orphan Stripe account when company insert fails"
```

---

## Task 2: F-304 — runValidators on editFacility and deployFacility

**Files:**
- Create: `server/tests/controllers/facilityController.runValidators.test.js`
- Modify: `server/controllers/facilityController.js` (`editFacility` ~line 221, `deployFacility` ~line 907)

- [ ] **Step 1: Inspect schema for an enum field**

Run: `grep -n "enum" server/models/facility.js` (use Grep tool).
Identify an enum field on `StorageFacility` (likely `status: { enum: [...] }`) so the test can violate it.

- [ ] **Step 2: Locate the actual edit/deploy route paths**

Run: `grep -n "editFacility\|deployFacility" server/routes/facilityRoutes.js` (use Grep tool).
Use whatever paths are bound — the example below assumes `PUT /facilities/update?facilityId=...`.

- [ ] **Step 3: Write the failing test**

Create `server/tests/controllers/facilityController.runValidators.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility } from "../helpers/factories.js";
import Facility from "../../models/facility.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("PUT /facilities/update — F-304 runValidators on update", () => {
  it("rejects an invalid enum value instead of silently saving it", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);

    const res = await api(app)
      .put(`/facilities/update`)
      .set("Cookie", adminCookie)
      .query({ facilityId: facility._id.toString() })
      .send({ status: "NotARealStatus" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const stored = await Facility.findById(facility._id);
    expect(stored.status).not.toBe("NotARealStatus");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd server && npx vitest run tests/controllers/facilityController.runValidators.test.js`
Expected: FAIL — the bad enum was accepted.

- [ ] **Step 5: Apply the fix**

In `server/controllers/facilityController.js`, find both `findByIdAndUpdate` calls in `editFacility` and `deployFacility`. Add `runValidators: true` to each options object:

Before:
```js
const updated = await StorageFacility.findByIdAndUpdate(facilityId, update, { new: true });
```
After:
```js
const updated = await StorageFacility.findByIdAndUpdate(facilityId, update, { new: true, runValidators: true });
```

- [ ] **Step 6: Run the facility test suite**

Run: `cd server && npx vitest run tests/controllers/facilityController`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/facilityController.js server/tests/controllers/facilityController.runValidators.test.js
git commit -m "Fix F-304: enforce schema validators on facility edit and deploy updates"
```

---

## PR 1 wrap-up

- [ ] **Step W1: Open PR 1**

```bash
git push -u origin HEAD
gh pr create --title "Backend audit: PR 1 — Stripe orphan cleanup and validator gaps (F-105, F-304)" --body "$(cat <<'EOF'
## Summary
- F-105: roll back Stripe Express account when company Mongo insert fails
- F-304: enforce schema validators on facility edit/deploy updates

## Test plan
- [ ] cd server && npm test passes
- [ ] companyController.stripeOrphan.test.js
- [ ] facilityController.runValidators.test.js

Spec: docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md
EOF
)"
```

---

# PR 2 — Email and onboarding polish

Findings: F-204, F-205, F-301, F-302, F-303, F-305

## Task 3: F-204 — Await transporter.sendMail in createUser

**Files:**
- Create: `server/tests/controllers/userController.createUserEmailFailure.test.js`
- Modify: `server/controllers/userController.js` `createUser` (~lines 167–172)

- [ ] **Step 1: Inspect `tests/helpers/mailer.mock.js`**

Run: Use Read tool on `server/tests/helpers/mailer.mock.js`.
Confirm how nodemailer is mocked so the test can override `sendMail`.

- [ ] **Step 2: Confirm registration route path**

Run: `grep -n "register\|createUser" server/routes/userRoutes.js` (use Grep tool).
User routes mount at `/` so the path is likely `POST /register` or `POST /users/register`. Use whatever the router exposes.

- [ ] **Step 3: Write the failing test**

Create `server/tests/controllers/userController.createUserEmailFailure.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    }),
  },
}));

let app, adminCookie, errorSpy;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /register — F-204 await sendMail", () => {
  it("returns 201 even when the confirmation email fails to send", async () => {
    const company = await makeCompany();

    const res = await api(app)
      .post("/register")
      .set("Cookie", adminCookie)
      .send({
        name: "New Person",
        displayName: "newp",
        email: `new-${Date.now()}@example.com`,
        role: "Company_User",
        company: company._id.toString(),
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
      });

    expect(res.status).toBe(201);
    expect(errorSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/userController.createUserEmailFailure.test.js`
Expected: FAIL — current handler does not await `sendMail`; either swallows or 500s on "headers after sent".

- [ ] **Step 5: Apply the fix**

In `userController.js` `createUser`, change the email block to:

```js
try {
  await transporter.sendMail(mailOptions);
} catch (mailErr) {
  console.error("Confirmation email failed to send:", mailErr.message);
}
return res.status(201).json(userWithCompany);
```

(Identifier names like `transporter`, `mailOptions`, `userWithCompany` must match what's already in scope — read lines 130–175 first and keep names as-is.)

- [ ] **Step 6: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/userController.createUserEmailFailure.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/userController.js server/tests/controllers/userController.createUserEmailFailure.test.js
git commit -m "Fix F-204: await sendMail in createUser and log-and-continue on failure"
```

---

## Task 4: F-205 — Don't unset `confirmed` on resend

**Files:**
- Create: `server/tests/controllers/userController.resendConfirmation.test.js`
- Modify: `server/controllers/userController.js` `sendUserConfirmationEmail` (~lines 394–400)

- [ ] **Step 1: Locate the resend route**

Run: `grep -n "sendUserConfirmationEmail\|resend" server/routes/userRoutes.js server/controllers/userController.js` (use Grep tool).
Identify the exact route + verb.

- [ ] **Step 2: Write the failing test**

Create `server/tests/controllers/userController.resendConfirmation.test.js`. Replace `/users/resend-confirmation/:userId` with the path you found:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";
import User from "../../models/user.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    }),
  },
}));

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("F-205 resend confirmation does not unset confirmed on email failure", () => {
  it("keeps a confirmed user confirmed when resend email fails", async () => {
    const target = await makeUser({ role: "Company_User", confirmed: true });

    await api(app)
      .post(`/users/resend-confirmation/${target._id.toString()}`)
      .set("Cookie", adminCookie);

    const reloaded = await User.findById(target._id);
    expect(reloaded.confirmed).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/userController.resendConfirmation.test.js`
Expected: FAIL — user's `confirmed` is now `false`.

- [ ] **Step 4: Apply the fix**

In `userController.js` `sendUserConfirmationEmail`, delete the `User.findByIdAndUpdate(userId, { confirmed: false }, ...)` call entirely. The link is gated by `existUser.confirmed === false` in `setUserPassword`.

- [ ] **Step 5: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/userController.resendConfirmation.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/userController.js server/tests/controllers/userController.resendConfirmation.test.js
git commit -m "Fix F-205: do not reset confirmed=false on resend confirmation"
```

---

## Task 5: F-301 — Null guard for facilities + role check first

**Files:**
- Create: `server/tests/controllers/userController.createUserNoFacilities.test.js`
- Modify: `server/controllers/userController.js` `createUser` (~lines 39–43)

- [ ] **Step 1: Write the failing test**

Create `server/tests/controllers/userController.createUserNoFacilities.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /register — F-301 null guard on facilities + role precedence", () => {
  it("returns a clean 4xx, not 500, when neither role nor facilities is supplied", async () => {
    const res = await api(app)
      .post("/register")
      .set("Cookie", adminCookie)
      .send({
        name: "Missing Role",
        displayName: "miss",
        email: `mr-${Date.now()}@example.com`,
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
        // role and facilities both omitted
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/userController.createUserNoFacilities.test.js`
Expected: FAIL — `TypeError: Cannot convert undefined or null to object` surfacing as 500.

- [ ] **Step 3: Apply the fix**

In `userController.js` `createUser`, reorder so role is checked first and guard `Object.keys`:

```js
if (!role) {
  return res.status(400).json({ error: "role is required" });
}

if (
  facilities &&
  Object.keys(facilities).length === 0 &&
  role !== "System_Admin" &&
  role !== "System_User"
) {
  return res.status(400).json({ error: "facilities required for non-system roles" });
}
```

Preserve the existing controller's wording — adapt the messages to whatever it currently uses.

- [ ] **Step 4: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/userController.createUserNoFacilities.test.js`
Expected: PASS, 400.

- [ ] **Step 5: Commit**

```bash
git add server/controllers/userController.js server/tests/controllers/userController.createUserNoFacilities.test.js
git commit -m "Fix F-301: check role before facilities and guard Object.keys"
```

---

## Task 6: F-302 — Replace SafePhish brand name in emails

**Files:**
- Create: `server/tests/controllers/userController.brandName.test.js`
- Modify: `server/controllers/userController.js` (lines ~67 and ~408)

- [ ] **Step 1: Locate occurrences**

Run: `grep -n "SafePhish" server/controllers/userController.js` (use Grep tool).
Record the line numbers.

- [ ] **Step 2: Write the failing test**

Create `server/tests/controllers/userController.brandName.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

const sendMail = vi.fn().mockResolvedValue({ messageId: "ok" });
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

let app, adminCookie;

beforeEach(async () => {
  sendMail.mockClear();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-302 confirmation emails do not reference SafePhish", () => {
  it("createUser email body does not contain 'SafePhish'", async () => {
    const company = await makeCompany();

    await api(app)
      .post("/register")
      .set("Cookie", adminCookie)
      .send({
        name: "Brand Test",
        displayName: "brand",
        email: `brand-${Date.now()}@example.com`,
        role: "Company_User",
        company: company._id.toString(),
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
      });

    expect(sendMail).toHaveBeenCalled();
    const mailArg = sendMail.mock.calls[0][0];
    const blob = JSON.stringify(mailArg);
    expect(blob).not.toMatch(/SafePhish/i);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/userController.brandName.test.js`
Expected: FAIL.

- [ ] **Step 4: Apply the fix**

Replace every `"SafePhish"` in `userController.js` with `"React-PMS"`. Use Edit with `replace_all: true` if all literals are identical.

- [ ] **Step 5: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/userController.brandName.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/userController.js server/tests/controllers/userController.brandName.test.js
git commit -m "Fix F-302: replace SafePhish placeholder in confirmation emails"
```

---

## Task 7: F-303 — Stripe onboarding URLs from FRONTEND_URL

**Files:**
- Create: `server/tests/controllers/companyController.stripeRedirectUrl.test.js`
- Modify: `server/controllers/companyController.js` `createStripeAccountLink` (lines 114–119)

- [ ] **Step 1: Locate the route path**

Run: `grep -n "createStripeAccountLink" server/routes/companyRoutes.js` (use Grep tool).
Use whatever path is bound.

- [ ] **Step 2: Write the failing test**

Create `server/tests/controllers/companyController.stripeRedirectUrl.test.js`. Replace the POST URL with the one you found:

```js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

const accountsRetrieve = vi.fn();
const accountLinksCreate = vi.fn();
vi.mock("stripe", () => ({
  default: () => ({
    accounts: { retrieve: accountsRetrieve, create: vi.fn(), del: vi.fn() },
    accountLinks: { create: accountLinksCreate },
  }),
}));

let app, adminCookie;

beforeEach(async () => {
  accountsRetrieve.mockReset();
  accountLinksCreate.mockReset();
  process.env.FRONTEND_URL = "https://app.example.test";

  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-303 Stripe onboarding redirects use FRONTEND_URL", () => {
  it("derives refresh_url and return_url from process.env.FRONTEND_URL", async () => {
    const company = await makeCompany({ stripe: { accountId: "acct_1", onboardingComplete: false } });
    accountsRetrieve.mockResolvedValue({ details_submitted: false, charges_enabled: false });
    accountLinksCreate.mockResolvedValue({ url: "https://stripe.example/onboard" });

    await api(app)
      .post(`/companies/${company._id.toString()}/stripe/onboarding-link`)
      .set("Cookie", adminCookie);

    expect(accountLinksCreate).toHaveBeenCalled();
    const args = accountLinksCreate.mock.calls[0][0];
    expect(args.refresh_url).toContain("https://app.example.test");
    expect(args.return_url).toContain("https://app.example.test");
    expect(args.refresh_url).not.toContain("localhost:5173");
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/companyController.stripeRedirectUrl.test.js`
Expected: FAIL — args still contain `localhost:5173`.

- [ ] **Step 4: Apply the fix**

In `companyController.js` `createStripeAccountLink`, replace:
```js
refresh_url: "http://localhost:5173/dashboard/companies",
return_url: "http://localhost:5173/dashboard/companies",
```
with:
```js
refresh_url: `${process.env.FRONTEND_URL}/dashboard/companies`,
return_url: `${process.env.FRONTEND_URL}/dashboard/companies`,
```

- [ ] **Step 5: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/companyController.stripeRedirectUrl.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/controllers/companyController.js server/tests/controllers/companyController.stripeRedirectUrl.test.js
git commit -m "Fix F-303: derive Stripe onboarding redirect URLs from FRONTEND_URL"
```

---

## Task 8: F-305 — Wrap editNote in try/catch

**Files:**
- Create: `server/tests/controllers/facilityController.editNote.test.js`
- Modify: `server/controllers/facilityController.js` `editNote` (~lines 674–688)

- [ ] **Step 1: Read existing `createNote` for the try/catch pattern**

Run: `grep -n "createNote\|editNote" server/controllers/facilityController.js` (use Grep tool); then read 20 lines around each.

- [ ] **Step 2: Locate the route**

Run: `grep -n "editNote\|notes" server/routes/facilityRoutes.js` (use Grep tool).

- [ ] **Step 3: Write the failing test**

Create `server/tests/controllers/facilityController.editNote.test.js`. Replace the PUT URL with the path you found:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-305 editNote returns a structured error rather than crashing", () => {
  it("returns 4xx/5xx JSON on an invalid ObjectId rather than an unhandled rejection", async () => {
    const res = await api(app)
      .put(`/facilities/not-an-objectid/notes/also-bad`)
      .set("Cookie", adminCookie)
      .send({ note: "updated" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
```

- [ ] **Step 4: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/facilityController.editNote.test.js`
Expected: FAIL — request hangs or returns non-JSON.

- [ ] **Step 5: Apply the fix**

Wrap the body of `editNote` in:
```js
try {
  // existing body
} catch (err) {
  console.error("editNote failed:", err);
  return res.status(500).json({ error: "Failed to update note" });
}
```
Mirror `createNote`'s exact pattern.

- [ ] **Step 6: Run test, confirm pass**

Run: `cd server && npx vitest run tests/controllers/facilityController.editNote.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/facilityController.js server/tests/controllers/facilityController.editNote.test.js
git commit -m "Fix F-305: wrap editNote in try/catch matching createNote"
```

---

## PR 2 wrap-up

- [ ] **Step W2: Run full suite, open PR 2**

```bash
cd server && npm test
git push
gh pr create --title "Backend audit: PR 2 — Email and onboarding polish (F-204, F-205, F-301, F-302, F-303, F-305)" --body "$(cat <<'EOF'
## Summary
- F-204: await sendMail and log-and-continue on failure
- F-205: stop resetting confirmed=false on resend
- F-301: role check before facilities; null-guard Object.keys
- F-302: drop SafePhish brand name from emails
- F-303: Stripe onboarding URLs from FRONTEND_URL
- F-305: editNote try/catch

## Test plan
- [ ] cd server && npm test passes
- [ ] 6 new test files under server/tests/controllers/

Spec: docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md
EOF
)"
```

---

# PR 3 — Routing hygiene

Findings: F-101, F-102

## Task 9: F-101 — Reorder companyRoutes.js

**Files:**
- Create: `server/tests/routes/companyRoutes.ordering.test.js`
- Modify: `server/routes/companyRoutes.js`

- [ ] **Step 1: Read current route order**

Use the Read tool on `server/routes/companyRoutes.js`. List every route + method + handler.

- [ ] **Step 2: Write the failing test**

Create `server/tests/routes/companyRoutes.ordering.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-101 companyRoutes: static segments do not collide with /:companyId", () => {
  it("GET /companies/:companyId resolves to the company-by-id handler", async () => {
    const company = await makeCompany();

    const res = await api(app)
      .get(`/companies/${company._id.toString()}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
  });

  it("static POST /companies/create still routes to createCompany", async () => {
    const res = await api(app)
      .post(`/companies/create`)
      .set("Cookie", adminCookie)
      .send({});

    expect(res.status).not.toBe(404);
  });

  it("static DELETE /companies/delete still routes to deleteCompany", async () => {
    const res = await api(app)
      .delete(`/companies/delete`)
      .set("Cookie", adminCookie)
      .query({});

    expect(res.status).not.toBe(404);
  });

  it("static PUT /companies/update still routes to editCompany", async () => {
    const res = await api(app)
      .put(`/companies/update`)
      .set("Cookie", adminCookie)
      .query({});

    expect(res.status).not.toBe(404);
  });
});
```

- [ ] **Step 3: Run test**

Run: `cd server && npx vitest run tests/routes/companyRoutes.ordering.test.js`
Expected: All pass before the reorder (current routes work because verbs differ). Tests lock the order in for future maintenance.

- [ ] **Step 4: Reorder `companyRoutes.js`**

Move every `/create`, `/delete`, `/update` line above any `/:companyId*` line. Preserve methods, middleware chains, and handlers verbatim.

- [ ] **Step 5: Re-run tests**

Run: `cd server && npx vitest run tests/routes/companyRoutes.ordering.test.js` and `cd server && npx vitest run tests/controllers/companyController`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/routes/companyRoutes.js server/tests/routes/companyRoutes.ordering.test.js
git commit -m "Fix F-101: register static company routes before /:companyId"
```

---

## Task 10: F-102 — Reorder rentalRoutes.js

**Files:**
- Create: `server/tests/routes/rentalRoutes.ordering.test.js`
- Modify: `server/routes/rentalRoutes.js`

- [ ] **Step 1: Read rentalRoutes.js**

Use Read tool. Map every variant: `/:companyId`, `/:companyId/facilities`, `/:companyId/:facilityId`, `/:companyId/:facilityId/:unitId`.

- [ ] **Step 2: Write the failing test**

Create `server/tests/routes/rentalRoutes.ordering.test.js`:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

let app;

beforeEach(async () => {
  app = buildApp();
});

describe("F-102 rentalRoutes: most-specific paths resolve first", () => {
  it("GET /rental/:cid/:fid/:uid resolves cleanly", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const res = await api(app).get(`/rental/${c._id}/${f._id}/${u._id}`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid/:fid resolves cleanly", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const res = await api(app).get(`/rental/${c._id}/${f._id}`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid/facilities resolves cleanly", async () => {
    const c = await makeCompany();

    const res = await api(app).get(`/rental/${c._id}/facilities`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid resolves cleanly", async () => {
    const c = await makeCompany();

    const res = await api(app).get(`/rental/${c._id}`);
    expect(res.status).not.toBe(500);
  });
});
```

- [ ] **Step 3: Run baseline**

Run: `cd server && npx vitest run tests/routes/rentalRoutes.ordering.test.js`
Expected: Probably passes today; locks behaviour in.

- [ ] **Step 4: Reorder `rentalRoutes.js`**

Place GET routes in this order:
1. `GET /:companyId/:facilityId/:unitId`
2. `GET /:companyId/:facilityId`
3. `GET /:companyId/facilities`
4. `GET /:companyId`

- [ ] **Step 5: Re-run tests**

Run: `cd server && npx vitest run tests/routes/rentalRoutes.ordering.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/routes/rentalRoutes.js server/tests/routes/rentalRoutes.ordering.test.js
git commit -m "Fix F-102: order most-specific rental routes before generic /:companyId"
```

---

## PR 3 wrap-up

- [ ] **Step W3: Run full suite, open PR 3**

```bash
cd server && npm test
git push
gh pr create --title "Backend audit: PR 3 — Routing hygiene (F-101, F-102)" --body "$(cat <<'EOF'
## Summary
- F-101: register static company routes before /:companyId
- F-102: order most-specific rental routes first

## Test plan
- [ ] cd server && npm test passes
- [ ] New tests in server/tests/routes/

Spec: docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md
EOF
)"
```

---

# PR 4 — Auth and middleware hardening

Findings: F-201, F-202, F-203, F-207

## Task 11: F-201 + F-202 — Drop dotenv duplicate + timing-safe API key compare

**Files:**
- Create: `server/tests/middleware/apiKeyAuth.timingSafe.test.js`
- Modify: `server/middleware/apiKeyAuth.js`

- [ ] **Step 1: Read current middleware**

Use Read tool on `server/middleware/apiKeyAuth.js`. Confirm export name, header name, and presence of `dotenv.config()`.

- [ ] **Step 2: Write the failing test**

Create `server/tests/middleware/apiKeyAuth.timingSafe.test.js`. If the current export is default, change `import { authenticateAPIKey }` to a default import:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { authenticateAPIKey } from "../../middleware/apiKeyAuth.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  process.env.API_KEY = "the-real-key-1234567890";
});

describe("F-201/F-202 apiKeyAuth uses timing-safe compare with length guard", () => {
  it("rejects a shorter wrong key without throwing", () => {
    const req = { headers: { "x-api-key": "short" } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("rejects an equal-length wrong key", () => {
    const req = { headers: { "x-api-key": "X".repeat("the-real-key-1234567890".length) } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("calls next() for the correct key", () => {
    const req = { headers: { "x-api-key": "the-real-key-1234567890" } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify behaviour**

Run: `cd server && npx vitest run tests/middleware/apiKeyAuth.timingSafe.test.js`
Expected: First two tests may already pass (current code uses `!==`); these now serve as the contract for the new implementation. The point is to lock in the behaviour and catch a `timingSafeEqual` length-mismatch crash.

- [ ] **Step 4: Apply the fix**

Replace `server/middleware/apiKeyAuth.js` with:

```js
import crypto from "crypto";

export const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const expected = process.env.API_KEY;

  if (!apiKey || !expected || apiKey.length !== expected.length) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const ok = crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
  if (!ok) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  return next();
};
```

If the original used a default export, also add `export default authenticateAPIKey;`. Remove any `import dotenv from "dotenv"; dotenv.config();` at the top.

- [ ] **Step 5: Run all middleware tests**

Run: `cd server && npx vitest run tests/middleware`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/middleware/apiKeyAuth.js server/tests/middleware/apiKeyAuth.timingSafe.test.js
git commit -m "Fix F-201/F-202: drop redundant dotenv and use timing-safe API key compare"
```

---

## Task 12: F-203 — 401 for expired JWT, 403 for tampered

**Files:**
- Create: `server/tests/middleware/authentication.expiredVsInvalid.test.js`
- Modify: `server/middleware/authentication.js`

- [ ] **Step 1: Read current middleware**

Use Read tool on `server/middleware/authentication.js`. Confirm export name, cookie key, and current catch behaviour.

- [ ] **Step 2: Write the failing test**

Create `server/tests/middleware/authentication.expiredVsInvalid.test.js`. Adjust import + cookie key if needed:

```js
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../../middleware/authentication.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

describe("F-203 JWT errors map to correct HTTP statuses", () => {
  it("returns 401 for an expired token", () => {
    const expired = jwt.sign({ id: "u1", role: "System_Admin" }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { cookies: { token: expired } };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 for a tampered token", () => {
    const ok = jwt.sign({ id: "u1", role: "System_Admin" }, process.env.JWT_SECRET);
    const tampered = ok.slice(0, -2) + "AA";
    const req = { cookies: { token: tampered } };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(403);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd server && npx vitest run tests/middleware/authentication.expiredVsInvalid.test.js`
Expected: expired test FAILS (currently returns 403).

- [ ] **Step 4: Apply the fix**

In `server/middleware/authentication.js`, change the catch block:

```js
} catch (err) {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }
  return res.status(403).json({ error: "Invalid token" });
}
```

- [ ] **Step 5: Run middleware tests**

Run: `cd server && npx vitest run tests/middleware`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add server/middleware/authentication.js server/tests/middleware/authentication.expiredVsInvalid.test.js
git commit -m "Fix F-203: return 401 for expired JWT, 403 for tampered JWT"
```

---

## Task 13: F-207 — Standardize on DS_PRIVATE_KEY_B64

**Files:**
- Create: `server/tests/services/docusignClient.envWarning.test.js`
- Modify: `server/services/docusignClient.js`, `CLAUDE.md`, `server/CLAUDE.md`

- [ ] **Step 1: Read the service**

Use Read tool on `server/services/docusignClient.js`. Note the exact env var reference.

- [ ] **Step 2: Write the failing test**

Create `server/tests/services/docusignClient.envWarning.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let warnSpy;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("F-207 DocuSign env var naming", () => {
  it("warns when neither DS_PRIVATE_KEY_B64 nor DS_PRIVATE_KEY_B is set", async () => {
    const prevB64 = process.env.DS_PRIVATE_KEY_B64;
    const prevB = process.env.DS_PRIVATE_KEY_B;
    delete process.env.DS_PRIVATE_KEY_B64;
    delete process.env.DS_PRIVATE_KEY_B;
    vi.resetModules();

    await import("../../services/docusignClient.js");

    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(messages).toMatch(/DS_PRIVATE_KEY_B64/);

    if (prevB64 !== undefined) process.env.DS_PRIVATE_KEY_B64 = prevB64;
    if (prevB !== undefined) process.env.DS_PRIVATE_KEY_B = prevB;
  });

  it("warns deprecation when only DS_PRIVATE_KEY_B is set", async () => {
    const prevB64 = process.env.DS_PRIVATE_KEY_B64;
    delete process.env.DS_PRIVATE_KEY_B64;
    process.env.DS_PRIVATE_KEY_B = "dGVzdC1rZXk=";
    vi.resetModules();

    await import("../../services/docusignClient.js");

    const messages = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(messages).toMatch(/DS_PRIVATE_KEY_B\b/);
    expect(messages).toMatch(/DS_PRIVATE_KEY_B64/);

    if (prevB64 !== undefined) process.env.DS_PRIVATE_KEY_B64 = prevB64;
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd server && npx vitest run tests/services/docusignClient.envWarning.test.js`
Expected: FAIL — no warnings logged.

- [ ] **Step 4: Apply the fix**

At the top of `server/services/docusignClient.js`, change the private-key read:

```js
const privateKeyB64 = process.env.DS_PRIVATE_KEY_B64 ?? process.env.DS_PRIVATE_KEY_B;

if (!privateKeyB64) {
  console.warn(
    "[docusignClient] Neither DS_PRIVATE_KEY_B64 nor DS_PRIVATE_KEY_B is set; DocuSign JWT auth will fail."
  );
} else if (!process.env.DS_PRIVATE_KEY_B64 && process.env.DS_PRIVATE_KEY_B) {
  console.warn(
    "[docusignClient] DS_PRIVATE_KEY_B is deprecated; rename to DS_PRIVATE_KEY_B64."
  );
}
```

Use `privateKeyB64` wherever the file previously read `process.env.DS_PRIVATE_KEY_B64` (or `_B`).

- [ ] **Step 5: Update CLAUDE.md docs**

In both `CLAUDE.md` (root) and `server/CLAUDE.md`, change `DS_PRIVATE_KEY_B` to `DS_PRIVATE_KEY_B64` in the env-var lists. Add a one-line note: "Legacy `DS_PRIVATE_KEY_B` is still read with a deprecation warning."

- [ ] **Step 6: Run test, confirm pass**

Run: `cd server && npx vitest run tests/services/docusignClient.envWarning.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/services/docusignClient.js server/tests/services/docusignClient.envWarning.test.js CLAUDE.md server/CLAUDE.md
git commit -m "Fix F-207: standardize on DS_PRIVATE_KEY_B64 with deprecation fallback"
```

---

## PR 4 wrap-up

- [ ] **Step W4: Run full suite, open PR 4**

```bash
cd server && npm test
git push
gh pr create --title "Backend audit: PR 4 — Auth and middleware hardening (F-201, F-202, F-203, F-207)" --body "$(cat <<'EOF'
## Summary
- F-201: drop redundant dotenv.config in apiKeyAuth
- F-202: timing-safe API key compare with length guard
- F-203: 401 for TokenExpiredError, 403 for tampered JWT
- F-207: standardize on DS_PRIVATE_KEY_B64 with legacy fallback + warning

## Test plan
- [ ] cd server && npm test passes
- [ ] New tests in server/tests/middleware/ and server/tests/services/

Spec: docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md
EOF
)"
```

---

# PR 5 — Cross-company isolation tail

Finding: F-206

## Task 14: F-206 — Scope getFacilities by company for non-System roles

**Files:**
- Create: `server/tests/controllers/facilityController.getFacilitiesScoped.test.js`
- Modify: `server/controllers/facilityController.js` `getFacilities` (~line 829)

- [ ] **Step 1: Read both `getFacilities` and `getFacilitiesAndCompany`**

Run: `grep -n "getFacilities\b\|getFacilitiesAndCompany" server/controllers/facilityController.js`. Read both and note the response shape (`{ facilities }` vs raw array).

- [ ] **Step 2: Confirm the route**

Run: `grep -n "getFacilities\b" server/routes/facilityRoutes.js`. Use the bound path.

- [ ] **Step 3: Write the failing test**

Create `server/tests/controllers/facilityController.getFacilitiesScoped.test.js`. Adjust GET path if needed:

```js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility } from "../helpers/factories.js";

let app;

beforeEach(async () => {
  app = buildApp();
});

describe("F-206 getFacilities scoping", () => {
  it("Company_Admin sees only their company's facilities", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();
    const facA = await makeFacility(companyA);
    const facB = await makeFacility(companyB);

    const userA = await makeUser({ role: "Company_Admin", company: companyA._id });
    const cookieA = cookieFor({ id: userA._id.toString(), role: userA.role });

    const res = await api(app).get(`/facilities`).set("Cookie", cookieA);
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : res.body.facilities;
    const ids = list.map((f) => f._id.toString());
    expect(ids).toContain(facA._id.toString());
    expect(ids).not.toContain(facB._id.toString());
  });

  it("System_Admin sees facilities from every company", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();
    const facA = await makeFacility(companyA);
    const facB = await makeFacility(companyB);

    const sysAdmin = await makeUser({ role: "System_Admin" });
    const cookie = cookieFor({ id: sysAdmin._id.toString(), role: sysAdmin.role });

    const res = await api(app).get(`/facilities`).set("Cookie", cookie);
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : res.body.facilities;
    const ids = list.map((f) => f._id.toString());
    expect(ids).toEqual(expect.arrayContaining([facA._id.toString(), facB._id.toString()]));
  });
});
```

- [ ] **Step 4: Run test to verify failure**

Run: `cd server && npx vitest run tests/controllers/facilityController.getFacilitiesScoped.test.js`
Expected: First test FAILS — Company_Admin sees both.

- [ ] **Step 5: Apply the fix**

In `facilityController.js` `getFacilities`, mirror the scoping pattern from `getFacilitiesAndCompany`:

```js
export const getFacilities = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isSystem = user.role === "System_Admin" || user.role === "System_User";
    const filter = isSystem ? {} : { company: user.company };

    const facilities = await StorageFacility.find(filter).sort({ facilityName: 1 });
    return res.status(200).json(facilities);
  } catch (err) {
    console.error("getFacilities failed:", err);
    return res.status(500).json({ error: "Failed to fetch facilities" });
  }
};
```

Match the existing response shape exactly — if the function returned `{ facilities }`, keep that.

- [ ] **Step 6: Run tests**

Run: `cd server && npx vitest run tests/controllers/facilityController`
Expected: All pass.

- [ ] **Step 7: Commit and open PR**

```bash
git add server/controllers/facilityController.js server/tests/controllers/facilityController.getFacilitiesScoped.test.js
git commit -m "Fix F-206: scope getFacilities by company for non-System roles"
git push
gh pr create --title "Backend audit: PR 5 — Cross-company isolation tail (F-206)" --body "$(cat <<'EOF'
## Summary
- F-206: scope getFacilities by company for Company_Admin/Company_User; System_* still see all

## Test plan
- [ ] cd server && npm test passes
- [ ] facilityController.getFacilitiesScoped.test.js covers both branches

Spec: docs/superpowers/specs/2026-05-13-finish-backend-audit-design.md
EOF
)"
```

---

## Final verification

- [ ] **Step F1: Full suite + lint**

```bash
cd server && npm test && npm run lint
```
Expected: All tests pass; ESLint reports 0 warnings.

- [ ] **Step F2: Audit closeout note**

Append a line to `docs/superpowers/audits/2026-05-12-backend-quality-audit.md`:

```
> **2026-05-13:** All remaining findings closed in PRs 1–5 of `claude/interesting-hofstadter-7b4829`. See [implementation plan](../plans/2026-05-13-finish-backend-audit.md).
```

Commit and push:
```bash
git add docs/superpowers/audits/2026-05-12-backend-quality-audit.md
git commit -m "Mark backend audit closed after PRs 1-5"
git push
```

---

## Notes for the executor

- **Adapt paths and identifiers to reality.** Several tests reference route paths (`/users/resend-confirmation/:userId`, `/facilities/.../notes/...`, etc.) that may differ from the live routers. Each task includes a "grep first" step — do it. Don't ship a test whose URL doesn't match the actual route.
- **Don't widen scope.** Fix only the finding the task names. Other smells (unrelated `if (arr)` instead of `if (arr.length)`, missing try/catch in untouched handlers) belong in a follow-up audit, not these PRs.
- **`runValidators: true` only on the two facility update calls named in F-304.** Don't add it globally — other update paths may rely on partial updates and were not audited.
- **If a fix breaks an existing test:** stop and investigate. Existing tests may encode behaviour that the fix legitimately changes (e.g. error-status assumptions). Update the test to match the new correct behaviour, but only if it's a direct consequence of the fix.
- **TDD discipline:** for each task, the test must be observed failing before the fix is applied. If a test passes before the fix, it isn't testing the right thing — adjust the test until it captures the bug, then fix.
