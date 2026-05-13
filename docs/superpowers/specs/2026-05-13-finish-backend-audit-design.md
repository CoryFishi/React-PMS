# Finish the Backend Audit — Design

**Date:** 2026-05-13
**Source audit:** `docs/superpowers/audits/2026-05-12-backend-quality-audit.md`
**Branch context:** `claude/interesting-hofstadter-7b4829`

## Goal

Close out the remaining 15 findings from the 2026-05-12 backend quality audit. No new features, no architectural changes — every PR is a bug fix or hardening change against the existing route + controller + model layout.

## Scope and non-goals

In scope:
- All remaining audit findings: F-101, F-102, F-105, F-201, F-202, F-203, F-204, F-205, F-206, F-207, F-301, F-302, F-303, F-304, F-305.
- A Vitest regression test for each finding (the audit already lists the test that locks each one in).

Explicitly out of scope:
- Replacing the F-001 501-stub with a real DocuSign lease flow (that's a feature, tracked separately).
- Performance work (indexes, caching, N+1 cleanup) — defer to a separate spec.
- New features from the README's pending list.
- Refactoring controllers, splitting files, or introducing new libraries (zod/joi/winston, etc.).

## Already fixed (for context)

The following 14 findings landed in earlier commits on this branch and are not in scope: F-001 (stubbed 501), F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-103, F-104, F-106, F-107, F-208, F-209.

## Approach

Theme-grouped PRs. Each PR groups findings that share a root cause so reviewers load one mental model per PR. Severity is preserved naturally because the highest-severity remaining items concentrate in PRs 1 and 3.

Each finding follows the same workflow:
1. Write a failing Vitest regression test mirroring the audit's "Test that locks it in".
2. Apply the suggested fix.
3. Confirm the test passes and the rest of the suite stays green.

Tests live under `server/tests/<area>/` matching the controller/middleware/route/service being fixed, consistent with the existing layout (`controllers/`, `middleware/`, `routes/`, `processes/`, `unit/`).

## PR breakdown

### PR 1 — Stripe orphan accounts and validator gaps

**Findings:** F-105, F-304
**Files touched:** `server/controllers/companyController.js`, `server/controllers/facilityController.js`
**Changes:**
- `createCompany`: validate required fields before calling `stripe.accounts.create`. In the catch block after a successful Stripe create but failed Mongo insert, call `stripe.accounts.del(stripeAccount.id)` and surface a 400/409 with the original validation error.
- `editFacility` and `deployFacility`: add `runValidators: true` to `findByIdAndUpdate` options.

**Tests:**
- `controllers/companyController.stripeOrphan.test.js` — mock Stripe (account create succeeds), force `Company.create` to throw a duplicate-key error, assert `stripe.accounts.del` was called with the orphan account id.
- `controllers/facilityController.runValidators.test.js` — send an `editFacility` payload that violates an enum on the schema; assert 400, not 200.

**Acceptance:** Stripe `del` is invoked exactly when Mongo insert fails; existing happy-path company creation still passes.

---

### PR 2 — Email and onboarding polish

**Findings:** F-204, F-205, F-301, F-302, F-303, F-305
**Files touched:** `server/controllers/userController.js`, `server/controllers/facilityController.js`, `server/controllers/companyController.js`
**Changes:**
- `createUser` (F-204): `await transporter.sendMail(...)` and log-and-continue on failure. The 201 still goes out because user creation itself succeeded.
- `sendUserConfirmationEmail` (F-205): drop the unconditional `confirmed: false` reset. The confirm link is already gated by `existUser.confirmed === false` in `setUserPassword`.
- `createUser` (F-301): move the `!role` check above any branch that reads `facilities`, and guard `Object.keys(facilities)` with `facilities &&`.
- Email templates (F-302): replace "SafePhish" with the actual product name in both confirmation handlers. Inline replacement is acceptable; centralizing the template is out of scope.
- `createStripeAccountLink` (F-303): derive `refresh_url` and `return_url` from `process.env.FRONTEND_URL`.
- `editNote` (F-305): wrap the handler body in try/catch matching `createNote`.

**Tests:**
- `controllers/userController.createUserEmailFailure.test.js` — mock the transporter to throw; assert 201 still returned and no "headers already sent" error.
- `controllers/userController.resendConfirmation.test.js` — confirm a user, hit resend with a failing transporter, assert the user's `confirmed` is still `true`.
- `controllers/userController.createUserNoFacilities.test.js` — POST without `facilities` and without `role`; assert a clean 400 rather than a `TypeError`.
- `controllers/userController.brandName.test.js` — capture the rendered email body; assert it does not contain "SafePhish".
- `controllers/companyController.stripeRedirectUrl.test.js` — set `process.env.FRONTEND_URL` to a sentinel; assert the Stripe account-link call receives URLs derived from it.
- `controllers/facilityController.editNote.test.js` — call `editNote` with an invalid ObjectId; assert a structured error response, not an unhandled rejection.

**Acceptance:** All six findings have a passing regression test; the existing user-onboarding test suite still passes.

---

### PR 3 — Routing hygiene

**Findings:** F-101, F-102
**Files touched:** `server/routes/companyRoutes.js`, `server/routes/rentalRoutes.js`
**Changes:**
- `companyRoutes.js`: move static-segment routes (`/create`, `/delete`, `/update`) above `/:companyId`. Keep current paths to avoid breaking the client.
- `rentalRoutes.js`: reorder so the most-specific paths come first: `/:companyId/:facilityId/:unitId`, `/:companyId/:facilityId`, `/:companyId/facilities`, `/:companyId`.

**Tests:**
- `routes/companyRoutes.ordering.test.js` — supertest hits each static path and asserts the correct handler runs (status + handler-side sentinel header or response shape).
- `routes/rentalRoutes.ordering.test.js` — same pattern for the four rental variants.

**Acceptance:** All existing client calls still resolve; new tests prove order-independence.

---

### PR 4 — Auth and middleware hardening

**Findings:** F-201, F-202, F-203, F-207
**Files touched:** `server/middleware/apiKeyAuth.js`, `server/middleware/authentication.js`, `server/services/docusignClient.js`, CLAUDE.md files.
**Changes:**
- `apiKeyAuth.js` (F-201): remove the redundant `dotenv.config()` call.
- `apiKeyAuth.js` (F-202): replace `apiKey !== API_KEY` with a length check followed by `crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(API_KEY))`.
- `authentication.js` (F-203): return 401 for `TokenExpiredError`, 403 for `JsonWebTokenError`.
- `docusignClient.js` (F-207): standardize on `DS_PRIVATE_KEY_B64`. Update both `CLAUDE.md` files to the same name. Add a startup warning if the var is absent. During the deprecation window, fall back to `DS_PRIVATE_KEY_B` with a warning so operators don't lose service on rename.

**Tests:**
- `middleware/apiKeyAuth.timingSafe.test.js` — wrong-length and right-length-wrong-value api keys both return 401; correct key returns next().
- `middleware/authentication.expiredVsInvalid.test.js` — send an expired JWT (sign with `expiresIn: "-1s"`) → 401; send a tampered JWT → 403.
- `services/docusignClient.envWarning.test.js` — unset `DS_PRIVATE_KEY_B64`, import the module, assert a warning is logged.

**Acceptance:** All four findings have passing tests; no behavior change on the happy path.

---

### PR 5 — Cross-company data isolation tail

**Findings:** F-206
**Files touched:** `server/controllers/facilityController.js`
**Changes:**
- `getFacilities`: apply the same scoping pattern used in `getFacilitiesAndCompany` — System_Admin sees all, every other role is scoped to `{ company: user.company }`.

**Tests:**
- `controllers/facilityController.getFacilitiesScoped.test.js` — seed two companies and two facilities; log in as Company_Admin of company A; assert the response only contains company A facilities.

**Acceptance:** Company_Admin and Company_User can no longer see other companies' facilities through `getFacilities`. System_Admin still sees everything.

---

## Risks and mitigations

- **Risk:** Reordering routes (PR 3) silently breaks a client call.
  **Mitigation:** Tests assert every static path resolves to its current handler before and after reorder; client code is not touched.
- **Risk:** `timingSafeEqual` throws on mismatched lengths.
  **Mitigation:** Explicit length check first; 401 if lengths differ.
- **Risk:** F-207 env var rename leaves operators stuck on the old name.
  **Mitigation:** Read `DS_PRIVATE_KEY_B64` first, fall back to `DS_PRIVATE_KEY_B` with a deprecation warning, then drop the fallback in a follow-up.

## Test strategy

- Each PR adds Vitest tests under `server/tests/<area>/`.
- Regression test is written first, observed failing, then the fix is applied (per the project's TDD norm in CLAUDE.md).
- `cd server && npm test` must stay green on every PR.
- No new test framework, runner, or coverage tool is introduced.

## Sequencing

PR 1 → 2 → 3 → 4 → 5 in order. Each lands independently; later PRs do not depend on earlier ones except through routine rebases. PR 3 and PR 4 can be parallelized if needed.

## Out-of-scope follow-ups

After this spec closes the audit, the natural next specs are:
1. Replace the F-001 501-stub with a real DocuSign lease flow.
2. Performance baseline + indexing pass.
3. Pick a feature from the README's pending list.

Each gets its own brainstorm.
