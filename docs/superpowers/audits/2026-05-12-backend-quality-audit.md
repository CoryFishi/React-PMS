# Backend Quality Audit — 2026-05-12

> **2026-05-13:** All remaining findings closed on branch `claude/interesting-hofstadter-7b4829`. See [implementation plan](../plans/2026-05-13-finish-backend-audit.md) for the 14-task closeout (5 themed PRs).

## Summary

Total findings: **29** (Critical: 8, High: 7, Medium: 9, Low: 5).

Top three risks:
1. **F-001** — `loginTenantAndCreateLease` references five undefined identifiers (`doc`, `envelopesApi`, `ACCOUNT_ID`, `Lease`, `leaseId`); every call to `POST /rental/:cid/:fid/:uid/login&rent` crashes at runtime with a `ReferenceError`.
2. **F-004** — `deleteTenant` always returns 409 "Tenant is associated to unit(s)" because `StorageUnit.find()` returns an array (truthy even when empty), making tenant deletion permanently broken.
3. **F-006** — All tenant-facing rental and payment endpoints (`/tenants`, `/payments`, `/rental`) use only API-key auth — there is no JWT check — allowing any caller with the shared API key to read or write any tenant's data without a user session.

---

## Method

Each exported controller function was walked against seven axes: authorization scope, HTTP status correctness, error handling, input validation, Mongo query correctness, side-effect ordering, and undefined-identifier correctness. Routes were traced from mounting in `app.js` through the router files to confirm middleware coverage and dynamic/static segment ordering. Models were inspected for missing defaults, problematic enums, and validators that may conflict with controller writes. Cross-cutting checks were applied to middleware, services, and background processes.

---

## Critical

### F-001 — Five undefined identifiers crash `loginTenantAndCreateLease`

- **Severity:** Critical
- **File:** `server/controllers/rentalController.js:261,266,271,272,277`
- **What:** `loginTenantAndCreateLease` uses `doc` (line 261), `envelopesApi` (line 266), `ACCOUNT_ID` (line 266), `Lease` (line 271), and `leaseId` (line 272), none of which are imported or defined anywhere in the file or its enclosing scope. The function imports `getEnvelopesApi` (the factory) but never calls it, and imports `docusign` for the envelope definition builder but never retrieves the API instance.
- **Why it matters:** Every call to `POST /rental/:companyId/:facilityId/:unitId/login&rent` throws a `ReferenceError` before any business logic executes, returning an unhandled exception (likely a 400 from the catch block). The lease-creation flow is entirely non-functional.
- **Suggested fix:** Call `const { envelopesApi, accountId: ACCOUNT_ID } = await getEnvelopesApi();` at the top of the handler. Define `doc` using a DocuSign `Document` builder with actual lease content. Import or create a `Lease` model (or remove the dead `Lease.updateOne` call if leases are tracked via `Rental`). Derive `leaseId` from a newly created rental record.
- **Test that locks it in:** An integration test that POSTs valid credentials to the endpoint and asserts a 200 response (or any non-500) would have caught this immediately.

---

### F-002 — `getTenants` always returns the outer empty array (variable shadowing)

- **Severity:** Critical
- **File:** `server/controllers/tenantController.js:108-135`
- **What:** The function declares `var tenants = []` on line 108. Inside each `if`/`else if`/`else` branch, a `const tenants = ...` is declared with the same name, shadowing the outer variable. The outer `tenants` is never assigned, so `return res.status(200).json(tenants)` on line 135 always returns `[]` regardless of query results.
- **Why it matters:** Every tenant list query silently returns an empty array. No error is thrown; the data is simply lost. Bug affects the `/tenants` route (API-key only, no JWT) and the `GET /facilities/:facilityId/tenants` route.
- **Suggested fix:** Remove the `var tenants = []` declaration and convert each branch to assign the outer variable: `tenants = await Tenant.find(...)`. Alternatively use `let` at the outer scope. Also correct the sort key typo `firstNameName` to `firstName` throughout (lines 121, 125, 130).
- **Test that locks it in:** Create a tenant, then GET the tenant list and assert the response array is non-empty.

---

### F-003 — `userConfirmationEmail` hard-codes `localhost:5173` as the redirect target

- **Severity:** Critical
- **File:** `server/controllers/userController.js:520`
- **What:** The email-confirmation link redirect is `http://localhost:5173/register/${userId}` unconditionally. In production this sends users to the developer's local machine.
- **Why it matters:** Email confirmation is broken in any non-local environment; new users can never activate their accounts.
- **Suggested fix:** Use `process.env.FRONTEND_URL` (already defined as an env var) instead of the hard-coded localhost URL.
- **Test that locks it in:** Test in a staging environment where `FRONTEND_URL` differs from `localhost:5173` and confirm the redirect goes to the correct host.

---

### F-004 — `deleteTenant` guard always fires, making deletion permanently impossible

- **Severity:** Critical
- **File:** `server/controllers/tenantController.js:209-212`
- **What:** `const unitsRented = await StorageUnit.find({ tenant: tenantId })` returns an array. The condition `if (unitsRented)` is always truthy (arrays are truthy in JavaScript, even `[]`). The 409 block is always reached and the tenant is never deleted.
- **Why it matters:** The tenant deletion endpoint `DELETE /tenants/delete` is completely non-functional for any tenant.
- **Suggested fix:** Change the guard to `if (unitsRented.length > 0)`.
- **Test that locks it in:** Create a tenant with no associated units, call DELETE, and assert 200 is returned.

---

### F-005 — `deleteUser` continues executing after response has been sent

- **Severity:** Critical
- **File:** `server/controllers/userController.js:317-331`
- **What:** After `User.findByIdAndDelete` succeeds and `res.status(200).send(...)` is called, the code falls through to `StorageFacility.updateMany(...)` (lines 323-325). If `findByIdAndDelete` returns null (user not found), `res.status(404).send(...)` is sent and then the `updateMany` still runs. Express will throw "Cannot set headers after they are sent" on any subsequent write attempt.
- **Why it matters:** Causes an unhandled error on the 404 path; on the success path the facility update still runs but a response has already been sent, meaning any downstream middleware writing to `res` will crash.
- **Suggested fix:** Move the `StorageFacility.updateMany` call before both response writes, or use `return` after each response branch.
- **Test that locks it in:** Call DELETE for a non-existent userId and assert exactly one 404 response with no server crash.

---

### F-006 — Tenant, payment, and rental routes missing JWT authentication

- **Severity:** Critical
- **File:** `server/routes/tenantRoutes.js:8-20`, `server/routes/paymentRoutes.js:8-14`, `server/routes/rentalRoutes.js:9-50`
- **What:** All routes in `tenantRoutes.js` and `paymentRoutes.js` use only `authenticateAPIKey` with no `authenticate` (JWT) middleware. `rentalRoutes.js` similarly has no JWT middleware on any route. Any caller who obtains the shared `API_KEY` can read, create, or modify tenants, trigger payment intents, and initiate leases without a user session.
- **Why it matters:** Tenant PII (name, address, driver's license, date of birth, hashed password, contact info) is readable and writable by anyone with the API key. There is no user-level audit trail for who performed these operations. This is a data-isolation failure across the entire tenant layer.
- **Suggested fix:** Add `authenticate` after `authenticateAPIKey` on all protected tenant and payment routes, consistent with how `facilityRoutes.js` and `companyRoutes.js` are protected. Routes that are legitimately unauthenticated (public rental center) should be explicitly documented.
- **Test that locks it in:** Remove the API key header and confirm tenant endpoints return 401; add the API key but no valid JWT cookie and confirm 401; confirm a valid JWT cookie returns 200.

---

### F-007 — `createFacility` mass-assigns `req.body` directly into `StorageFacility.create()`

- **Severity:** Critical
- **File:** `server/controllers/facilityController.js:109`
- **What:** `StorageFacility.create(req.body)` passes the full request body unfiltered to Mongoose. An attacker can inject arbitrary fields: `company`, `status`, `createdBy`, or embedded `units` arrays. The same pattern exists in `deployFacility` (line 908) and `editFacility` (line 221).
- **Why it matters:** A malicious caller could set `company` to any ObjectId (reassigning the facility to a different company) or set `status: "Enabled"` on a facility that should require deployment workflow.
- **Suggested fix:** Destructure only expected fields from `req.body` and pass a constructed object to `create()`. Apply `runValidators: true` on all `findByIdAndUpdate` calls.
- **Test that locks it in:** POST a facility with a forged `company` ObjectId; assert the stored document reflects the server-enforced company, not the attacker-supplied value.

---

### F-008 — `editCompany` mass-assigns `req.body` directly

- **Severity:** Critical
- **File:** `server/controllers/companyController.js:351`
- **What:** `Company.findByIdAndUpdate(req.query.companyId, req.body, { new: true, runValidators: true })` passes the full request body. An attacker can overwrite `stripe.accountId`, `stripe.onboardingComplete`, or `createdBy` by including them in the request body.
- **Why it matters:** Overwriting `stripe.onboardingComplete: true` without a real Stripe verification allows the company to collect payments through Stripe without completing onboarding. Overwriting `stripe.accountId` redirects all future payments to an attacker-controlled Stripe account.
- **Suggested fix:** Destructure the editable fields from `req.body` explicitly (e.g., `companyName`, `address`, `contactInfo`, `logo`, `status`) and build the update document manually. Strip all `stripe.*` fields from the client-writable payload.
- **Test that locks it in:** PUT company update with `stripe.onboardingComplete: true` in the body; assert the stored document does not reflect that change.

---

## High

### F-101 — Route ordering in `companyRoutes.js` shadows static routes with `/:companyId`

- **Severity:** High
- **File:** `server/routes/companyRoutes.js:39-67`
- **What:** `GET /:companyId` is registered at line 39, before `POST /create` (line 57), `DELETE /delete` (line 63), and `PUT /update` (line 69). Because those later entries use different HTTP methods, no current route is actually shadowed. However, `GET /:companyId/facilities` (line 45) is registered after `GET /:companyId` (line 39) — this works only because the extra `/facilities` segment prevents the match. If a `GET /create` or `GET /delete` endpoint is ever added, it will be eaten by `/:companyId`.
- **Why it matters:** Fragile ordering dependent on HTTP verb differences rather than explicit design intent. A future `GET /create` endpoint will silently be matched by `/:companyId` with `companyId = "create"`.
- **Suggested fix:** Move all static-segment routes (`/create`, `/delete`, `/update`) above the dynamic `/:companyId` routes, or adopt REST-idiomatic paths (`POST /`, `DELETE /:companyId`, `PUT /:companyId`).
- **Test that locks it in:** Integration test that hits each static path and verifies the correct handler is invoked.

---

### F-102 — Route ordering in `rentalRoutes.js` may shadow more-specific paths with `/:companyId`

- **Severity:** High
- **File:** `server/routes/rentalRoutes.js:25-50`
- **What:** `GET /:companyId` (line 25) is registered before `GET /:companyId/facilities` (line 30), `GET /:companyId/:facilityId` (line 40), and `GET /:companyId/:facilityId/:unitId` (line 46). Express evaluates routes in order; for `GET /rental/abc/facilities`, `/:companyId` does not match because the pattern has no second segment, so Express advances to the next route. This works today but depends on Express internal matching rather than explicit design.
- **Why it matters:** Any reordering during maintenance could silently break routing. The pattern is also inconsistent with best practice.
- **Suggested fix:** Register more-specific routes (those with extra segments) before less-specific ones: order should be `/:companyId/:facilityId/:unitId`, `/:companyId/:facilityId`, `/:companyId/facilities`, `/:companyId`.
- **Test that locks it in:** Integration tests that hit each route variant and assert the correct handler is invoked.

---

### F-103 — `GET /users/confirm/:userId` is behind JWT `authenticate` middleware

- **Severity:** High
- **File:** `server/routes/userRoutes.js:65-70`
- **What:** The email confirmation link `GET /users/confirm/:userId` is protected by both `authenticateAPIKey` and `authenticate`. A new user clicking the link in their email has no JWT cookie (they haven't logged in yet), so `authenticate` rejects them with 403 before they can confirm their account.
- **Why it matters:** Email confirmation is permanently broken for new users who have never logged in. This endpoint must be publicly accessible (with only the userId as the identity mechanism) to serve its purpose.
- **Suggested fix:** Remove `authenticate` from this specific route. The `userId` in the URL is a sufficient short-term identity proof for confirmation purposes.
- **Test that locks it in:** Create a user, request the confirm URL without a JWT cookie, assert 200 redirect.

---

### F-104 — `PUT /users/confirm/:userId` is also behind JWT `authenticate`

- **Severity:** High
- **File:** `server/routes/userRoutes.js:59-64`
- **What:** Same problem as F-103 but for `PUT /users/confirm/:userId` which allows a new user to set their password. A new user setting their password for the first time has no JWT cookie; `authenticate` blocks them.
- **Why it matters:** New user onboarding (email confirmation + password set) is broken end-to-end in combination with F-103.
- **Suggested fix:** Remove `authenticate` from this route. The `existUser.confirmed === false` check (line 549) provides sufficient replay protection.
- **Test that locks it in:** Full onboarding flow: create user, click confirm link without JWT, set password, assert 200.

---

### F-105 — `createCompany` can leave a Stripe orphan account on MongoDB save failure

- **Severity:** High
- **File:** `server/controllers/companyController.js:14-35`
- **What:** `stripe.accounts.create()` is called first (line 14). If `Company.create()` then fails (duplicate name, validation error), the Stripe Express account is created in Stripe but has no corresponding MongoDB document.
- **Why it matters:** Each failure accumulates a zombie Stripe Express account. After repeated validation failures (common during UI development), this becomes a billing and cleanup burden.
- **Suggested fix:** Validate all required fields before calling Stripe. In the catch block, call `stripe.accounts.del(stripeAccount.id)` if the MongoDB insert failed.
- **Test that locks it in:** Submit a company creation with a duplicate `companyName`; verify no new Stripe account was created.

---

### F-106 — `getDashboardData` spreads an ObjectId as a Mongo filter, leaking cross-company counts

- **Severity:** High
- **File:** `server/controllers/userController.js:649-710`
- **What:** `const companyFilter = user.role === "System_Admin" ? [] : user.company;`. For non-System_Admin users, `companyFilter` is an ObjectId. Then `{ ...companyFilter }` is used in count queries. Spreading an ObjectId produces `{}` (an empty object), so non-admin users get global counts across all companies.
- **Why it matters:** Company_Admin and Company_User roles see all users, facilities, tenants, and events from every company in the dashboard — a business-sensitive data isolation failure.
- **Suggested fix:** Use `const companyFilter = user.role === "System_Admin" ? {} : { company: user.company };` and spread that directly into queries.
- **Test that locks it in:** Create two companies with tenants; log in as Company_Admin of company A; assert dashboard counts match only company A's data.

---

### F-107 — `getUserById` and `loginUser` return password hash to the client

- **Severity:** High
- **File:** `server/controllers/userController.js:621`, `server/controllers/userController.js:242`
- **What:** `getUserById` fetches the user without `.select("-password")` and returns the full document. `loginUser` similarly returns `res.status(200).json(user)` where `user` is the Mongoose document including the `password` field.
- **Why it matters:** Any authenticated user can fetch another user's bcrypt hash. Even bcrypt hashes should never be transmitted to clients; they are subject to offline dictionary attacks.
- **Suggested fix:** Add `.select("-password")` to all user queries that return to the client: `getUserById`, `loginUser`, `editUser`, `createUser`.
- **Test that locks it in:** Fetch a user by ID and assert the response body does not contain a `password` field.

---

## Medium

### F-201 — `apiKeyAuth.js` calls `dotenv.config()` redundantly

- **Severity:** Medium
- **File:** `server/middleware/apiKeyAuth.js:1-2`
- **What:** `dotenv.config()` is called at the top of this middleware file. `index.js` already calls it before `buildApp()` and before any module is instantiated.
- **Why it matters:** Redundant `dotenv.config()` calls cause confusion about which module owns environment loading; in some deployment configurations they could silently overwrite runtime-injected values.
- **Suggested fix:** Remove `dotenv.config()` from `apiKeyAuth.js`.
- **Test that locks it in:** Remove the call; confirm API key middleware still functions when `index.js` runs first.

---

### F-202 — API key comparison is not constant-time (timing-attack vector)

- **Severity:** Medium
- **File:** `server/middleware/apiKeyAuth.js:11`
- **What:** `if (apiKey !== API_KEY)` uses JavaScript's default string equality which short-circuits on the first differing byte, leaking timing information about how many characters of the correct key the attacker has guessed.
- **Why it matters:** Over many requests an attacker can statistically determine the correct API key character by character.
- **Suggested fix:** Use `crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(API_KEY))` after verifying both strings have the same length.
- **Test that locks it in:** Code review confirmation that the comparison uses the constant-time function.

---

### F-203 — `authentication.js` returns 403 for all JWT errors including expired tokens

- **Severity:** Medium
- **File:** `server/middleware/authentication.js:14-16`
- **What:** The catch block returns `403 Forbidden` for any `jwt.verify` error, including `TokenExpiredError`. RFC 6750 and common practice use 401 for expired tokens (signal to reauthenticate) and 403 for structurally invalid tokens (signal of tampering).
- **Why it matters:** Expired-token responses are indistinguishable from forbidden-access responses on the client, making automatic reauthentication logic difficult.
- **Suggested fix:** Check `err.name === "TokenExpiredError"` and return 401; return 403 for `JsonWebTokenError`.
- **Test that locks it in:** Send a known-expired token and assert 401; send a tampered token and assert 403.

---

### F-204 — `createUser` calls `sendMail` without `await` and swallows errors

- **Severity:** Medium
- **File:** `server/controllers/userController.js:167-172`
- **What:** `transporter.sendMail(mailOptions)` is not awaited. The subsequent `return res.status(201).json(userWithCompany)` runs immediately. If `sendMail` fails, the inner catch block attempts to call `res.status(500).send(...)` after the 201 has already been sent, causing "Cannot set headers after they are sent."
- **Why it matters:** Email failures are silently lost; the server may log an unhandled error on the next request.
- **Suggested fix:** Use `await transporter.sendMail(mailOptions)` and handle the failure before sending the 201 response. Log and continue rather than returning 500, since user creation itself succeeded.
- **Test that locks it in:** Mock the transporter to throw; assert the response still completes and the error is logged.

---

### F-205 — `sendUserConfirmationEmail` resets `confirmed` to `false` unconditionally

- **Severity:** Medium
- **File:** `server/controllers/userController.js:394-400`
- **What:** The handler calls `User.findByIdAndUpdate(userId, { confirmed: false }, ...)` to un-confirm the user before resending the email. If the email then fails, the user is locked out of their account permanently.
- **Why it matters:** A transient email failure after resend causes the user's `confirmed` flag to be set to `false` with no recovery path short of admin intervention.
- **Suggested fix:** Do not set `confirmed: false` in the resend path. The confirmation link is already gated by `existUser.confirmed === false` in `setUserPassword`, so a previously confirmed user cannot re-use the link.
- **Test that locks it in:** Create and confirm a user, hit resend, mock the email to fail, assert the user can still log in.

---

### F-206 — `getFacilities` returns all facilities with no company scoping

- **Severity:** Medium
- **File:** `server/controllers/facilityController.js:829`
- **What:** `StorageFacility.find({}).sort({ facilityName: 1 })` returns every facility in the database regardless of which company the requesting user belongs to.
- **Why it matters:** A Company_Admin user from company A can see the names, addresses, and configuration of facilities belonging to company B.
- **Suggested fix:** Apply the same scoping logic used in `getFacilitiesAndCompany` (which correctly scopes by `company: user.company` for non-System_Admin roles) to `getFacilities`.
- **Test that locks it in:** Log in as Company_Admin of company A; call `GET /facilities`; assert only company A facilities are returned.

---

### F-207 — `docusignClient.js` reads `DS_PRIVATE_KEY_B64` but documentation names it `DS_PRIVATE_KEY_B`

- **Severity:** Medium
- **File:** `server/services/docusignClient.js:21`
- **What:** `process.env.DS_PRIVATE_KEY_B64` is used in the code, but both `CLAUDE.md` files document the env var name as `DS_PRIVATE_KEY_B`. If the `.env` file uses the documented name the JWT token request silently fails with an undefined key.
- **Why it matters:** The DocuSign service fails to authenticate unless the operator uses the code-side name rather than the documented name — a silent misconfiguration risk.
- **Suggested fix:** Choose one canonical name (`DS_PRIVATE_KEY_B64` is clearer), update all documentation to match, and add a startup assertion that logs a warning if the var is absent.
- **Test that locks it in:** Start the server without `DS_PRIVATE_KEY_B64` set; assert the DocuSign ping returns a clear error rather than a silent failure.

---

### F-208 — `delinquency.js` and `monthly.js` use CommonJS `require()` in an ESM project

- **Severity:** Medium
- **File:** `server/processes/delinquency.js:1-6`, `server/processes/monthly.js:1-6`
- **What:** Both files use `const mongoose = require("mongoose")` and `const dotenv = require("dotenv").config()`. The package has `"type": "module"` in `package.json`, making all `.js` files ESM modules where `require` is not defined.
- **Why it matters:** Running either file with Node directly in the ESM context throws `ReferenceError: require is not defined`. They currently work only if invoked with a special CommonJS shim or wrapper, which is undocumented and fragile.
- **Suggested fix:** Rewrite both files to use `import` statements consistent with the rest of the codebase.
- **Test that locks it in:** `node server/processes/delinquency.js` should complete without a ReferenceError.

---

### F-209 — `monthly.js` reads `storageUnit.pricePerMonth` instead of `storageUnit.paymentInfo.pricePerMonth`

- **Severity:** Medium
- **File:** `server/processes/monthly.js:45`
- **What:** `totalAdditionalBalance += storageUnit.pricePerMonth` — the `StorageUnit` schema stores the price at `paymentInfo.pricePerMonth`, not at the top level. The result is `NaN`; `$inc: { balance: NaN }` corrupts tenant balance to NaN in MongoDB.
- **Why it matters:** The monthly billing job silently corrupts every tenant's balance field rather than incrementing it.
- **Suggested fix:** Change to `storageUnit.paymentInfo?.pricePerMonth ?? 0`.
- **Test that locks it in:** Run the monthly script against a test tenant; assert the tenant's balance increased by the correct expected amount.

---

## Low

### F-301 — `createUser` evaluates `Object.keys(facilities)` before null-checking `facilities`

- **Severity:** Low
- **File:** `server/controllers/userController.js:39`
- **What:** `Object.keys(facilities).length === 0` is evaluated before the `!role` check (line 43). If `facilities` is `undefined` (not provided), `Object.keys(undefined)` throws `TypeError: Cannot convert undefined or null to object`.
- **Suggested fix:** Move the `!role` check before any check that depends on `role` or `facilities`. Add a null-guard: `facilities && Object.keys(facilities).length === 0`.

---

### F-302 — Confirmation emails reference the wrong product name ("SafePhish")

- **Severity:** Low
- **File:** `server/controllers/userController.js:67`, `server/controllers/userController.js:408`
- **What:** The email subject, body header, and footer reference "SafePhish" — a previous project name. The actual product is a property management system.
- **Suggested fix:** Replace all "SafePhish" references with the correct brand name. Centralize the email template to avoid the same copy appearing in two handlers.

---

### F-303 — `createStripeAccountLink` hard-codes `localhost:5173` redirect URLs

- **Severity:** Low
- **File:** `server/controllers/companyController.js:116-117`
- **What:** `refresh_url` and `return_url` for Stripe onboarding are both `"http://localhost:5173/dashboard/companies"` unconditionally.
- **Suggested fix:** Derive these from `process.env.FRONTEND_URL`.

---

### F-304 — `editFacility` and `deployFacility` omit `runValidators: true`

- **Severity:** Low
- **File:** `server/controllers/facilityController.js:221`, `server/controllers/facilityController.js:907`
- **What:** Both handlers use `findByIdAndUpdate` without `runValidators: true`, so Mongoose schema validations (enums, required fields) are bypassed on updates.
- **Suggested fix:** Add `runValidators: true` to both update options objects.

---

### F-305 — `editNote` has no try/catch

- **Severity:** Low
- **File:** `server/controllers/facilityController.js:674-688`
- **What:** The `editNote` handler has no `try/catch` block. Any Mongoose error (invalid ObjectId, save failure) will bubble up as an unhandled promise rejection.
- **Suggested fix:** Wrap the handler body in a `try/catch` matching the pattern used in `createNote`.

---

## Per-file index

| File | Findings |
|---|---|
| `server/index.js` | Clean |
| `server/app.js` | Clean |
| `server/middleware/authentication.js` | F-203 |
| `server/middleware/apiKeyAuth.js` | F-201, F-202 |
| `server/helpers/password.js` | Clean |
| `server/services/stripeConnect.js` | Clean |
| `server/services/docusignClient.js` | F-207 |
| `server/controllers/userController.js` | F-003, F-005, F-106, F-107, F-204, F-205, F-301, F-302 |
| `server/controllers/companyController.js` | F-008, F-105, F-303 |
| `server/controllers/facilityController.js` | F-007, F-206, F-304, F-305 |
| `server/controllers/tenantController.js` | F-002, F-004 |
| `server/controllers/eventsController.js` | Clean |
| `server/controllers/paymentController.js` | Clean |
| `server/controllers/rentalController.js` | F-001 |
| `server/routes/userRoutes.js` | F-103, F-104 |
| `server/routes/companyRoutes.js` | F-101 |
| `server/routes/facilityRoutes.js` | Clean |
| `server/routes/tenantRoutes.js` | F-006 |
| `server/routes/eventRoutes.js` | Clean |
| `server/routes/paymentRoutes.js` | F-006 |
| `server/routes/rentalRoutes.js` | F-006, F-102 |
| `server/models/company.js` | Clean |
| `server/models/event.js` | Clean |
| `server/models/facility.js` | Clean |
| `server/models/payment.js` | Clean |
| `server/models/rental.js` | Clean |
| `server/models/role.js` | Clean |
| `server/models/tenant.js` | Clean |
| `server/models/unit.js` | Clean |
| `server/models/unitType.js` | Clean |
| `server/models/user.js` | Clean |
| `server/processes/delinquency.js` | F-208 |
| `server/processes/monthly.js` | F-208, F-209 |

---

## Fix plan

### Phase 1 — Critical (block all merges until resolved)

| Finding | Task |
|---|---|
| F-001 | Define missing identifiers in `loginTenantAndCreateLease`; wire DocuSign API call; resolve Lease/Rental model usage |
| F-002 | Fix variable shadowing in `getTenants`; fix `firstNameName` sort key typo |
| F-003 | Replace hard-coded `localhost:5173` with `process.env.FRONTEND_URL` in `userConfirmationEmail` |
| F-004 | Fix `deleteTenant` guard to check `unitsRented.length > 0` |
| F-005 | Restructure `deleteUser` to prevent double-response; move `updateMany` before response sends |
| F-006 | Add `authenticate` JWT middleware to all tenant, payment, and rental protected routes |
| F-007 | Destructure and whitelist fields in `createFacility`, `editFacility`, `deployFacility` |
| F-008 | Destructure and whitelist fields in `editCompany`; strip all `stripe.*` from client-writable payload |

### Phase 2 — High (same sprint, second priority)

| Finding | Task |
|---|---|
| F-101 | Reorder company routes; move static segments above `/:companyId` |
| F-102 | Reorder rental routes; move more-specific paths above `/:companyId` |
| F-103 | Remove `authenticate` from `GET /users/confirm/:userId` |
| F-104 | Remove `authenticate` from `PUT /users/confirm/:userId` |
| F-105 | Add Stripe account cleanup in `createCompany` error path; validate fields before calling Stripe |
| F-106 | Fix `companyFilter` spread logic in `getDashboardData` |
| F-107 | Add `.select("-password")` to `getUserById`, `loginUser`, `editUser`, `createUser` responses |

---

## Deferred to follow-up PRs

The following Medium and Low findings are not blocking for the Critical fix pass and should be addressed in subsequent PRs:

- **F-201** (dotenv duplicate call) — trivial cleanup, no runtime risk
- **F-202** (timing-safe API key comparison) — moderate security improvement, no breaking change
- **F-203** (JWT error status codes) — UX improvement for client reauthentication flows
- **F-204** (await sendMail) — stability fix for confirmation email path
- **F-205** (resend email resets confirmed) — potential lockout risk on transient email failure
- **F-206** (getFacilities cross-company data leak) — data isolation fix requiring scoped query
- **F-207** (DS_PRIVATE_KEY env var name mismatch) — config alignment; verify against actual env before fixing
- **F-208** (CommonJS require in ESM) — rewrite process scripts to ESM; test independently
- **F-209** (monthly.js wrong balance field path) — billing correctness fix for background job
- **F-301** (facilities null guard in createUser) — defensive coding
- **F-302** (SafePhish brand name in emails) — cosmetic cleanup
- **F-303** (localhost URLs in Stripe onboarding) — production-readiness fix
- **F-304** (runValidators missing on facility updates) — validation enforcement
- **F-305** (editNote missing try/catch) — defensive coding
