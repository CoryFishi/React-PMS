# DocuSign JWT Token Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the crashing `docusign-esign` JWT token-acquisition path in `server/services/docusignClient.js` with a `jsonwebtoken` RS256 assertion + `fetch` to DocuSign's OAuth endpoints, so token failures surface real errors instead of crashing the Node process.

**Architecture:** Single source file rewrite behind the unchanged `getEnvelopesApi()` export. New internal `mintAccessToken()` and `resolveAccountId()` use `jsonwebtoken` + global `fetch`. `docusign-esign` `EnvelopesApi` (never in the crash path) is kept. The module-level env-warning block is preserved verbatim so the existing env-warning test stays green.

**Tech Stack:** Node ESM, `jsonwebtoken@^9.0.2` (existing dep), Node 22 global `fetch`, `docusign-esign` (kept for `ApiClient` Bearer carrier + `EnvelopesApi`), Vitest.

**Spec:** [docs/superpowers/specs/2026-05-17-docusign-jwt-token-fix-design.md](../specs/2026-05-17-docusign-jwt-token-fix-design.md)

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `server/services/docusignClient.js` | Acquire DocuSign JWT token + account id; expose `getEnvelopesApi()` | Rewrite internals; keep export signature + warning block |
| `server/tests/services/docusignClient.token.test.js` | Verify token acquisition, caching, error surfacing, account-id resolution | New |
| `server/tests/services/docusignClient.envWarning.test.js` | Existing env-warning regression | Unchanged — must stay green |

No other files change. No deps added.

---

## Task 1: Add the failing token-acquisition test

**Files:**
- Create: `server/tests/services/docusignClient.token.test.js`

- [ ] **Step 1: Write the test file**

Create `server/tests/services/docusignClient.token.test.js` with exactly this content:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "node:crypto";

// Ephemeral RSA keypair so jwt.sign(RS256) works without real DocuSign creds.
const { privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const PRIVATE_PEM_B64 = Buffer.from(privateKey, "utf8").toString("base64");

let fetchSpy;
let warnSpy;
let savedEnv;

const DS_KEYS = [
  "DS_PRIVATE_KEY_B64",
  "DS_PRIVATE_KEY_B",
  "DS_ACCOUNT_ID",
  "DS_BASE_PATH",
  "DS_INTEGRATION_KEY",
  "DS_OAUTH_BASE",
  "DS_USER_ID",
];

beforeEach(() => {
  savedEnv = {};
  for (const k of DS_KEYS) savedEnv[k] = process.env[k];

  process.env.DS_PRIVATE_KEY_B64 = PRIVATE_PEM_B64;
  delete process.env.DS_PRIVATE_KEY_B;
  process.env.DS_BASE_PATH = "https://demo.docusign.net/restapi";
  process.env.DS_INTEGRATION_KEY = "ik-test";
  process.env.DS_OAUTH_BASE = "account-d.docusign.com";
  process.env.DS_USER_ID = "user-test";
  process.env.DS_ACCOUNT_ID = "acct-from-env";

  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.resetModules();
});

afterEach(() => {
  for (const k of DS_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  warnSpy.mockRestore();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function tokenOk(body = { access_token: "tok-abc", expires_in: 3600 }) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}
function httpErr(status, body) {
  return {
    ok: false,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
}

describe("docusignClient token acquisition", () => {
  it("happy path: mints token via fetch and returns EnvelopesApi + env accountId", async () => {
    fetchSpy.mockResolvedValueOnce(tokenOk());
    const docusign = (await import("docusign-esign")).default;
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    const { envelopesApi, accountId } = await getEnvelopesApi();

    expect(accountId).toBe("acct-from-env");
    expect(envelopesApi).toBeInstanceOf(docusign.EnvelopesApi);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://account-d.docusign.com/oauth/token");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(opts.body).toContain(
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer"
    );
    expect(opts.body).toContain("assertion=");
  });

  it("caches the token: second call within TTL does not re-fetch /oauth/token", async () => {
    fetchSpy.mockResolvedValueOnce(tokenOk());
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    await getEnvelopesApi();
    await getEnvelopesApi();

    const tokenCalls = fetchSpy.mock.calls.filter(([u]) =>
      String(u).endsWith("/oauth/token")
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("surfaces the real DocuSign error and rejects (no process crash)", async () => {
    fetchSpy.mockResolvedValueOnce(httpErr(400, { error: "consent_required" }));
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    await expect(getEnvelopesApi()).rejects.toThrow(/consent_required/);
  });

  it("rejects with a clear error when no private key is configured", async () => {
    delete process.env.DS_PRIVATE_KEY_B64;
    delete process.env.DS_PRIVATE_KEY_B;
    vi.resetModules();
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    await expect(getEnvelopesApi()).rejects.toThrow(/private key is not configured/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("resolves accountId via /oauth/userinfo when DS_ACCOUNT_ID is unset", async () => {
    delete process.env.DS_ACCOUNT_ID;
    vi.resetModules();
    fetchSpy.mockResolvedValueOnce(tokenOk());
    fetchSpy.mockResolvedValueOnce(
      tokenOk({ accounts: [{ account_id: "acc-1", is_default: true }] })
    );
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    const { accountId } = await getEnvelopesApi();

    expect(accountId).toBe("acc-1");
    const userinfoCall = fetchSpy.mock.calls.find(([u]) =>
      String(u).endsWith("/oauth/userinfo")
    );
    expect(userinfoCall).toBeTruthy();
    expect(userinfoCall[1].headers.Authorization).toBe("Bearer tok-abc");
  });

  it("rejects when /oauth/userinfo fails and DS_ACCOUNT_ID is unset", async () => {
    delete process.env.DS_ACCOUNT_ID;
    vi.resetModules();
    fetchSpy.mockResolvedValueOnce(tokenOk());
    fetchSpy.mockResolvedValueOnce(httpErr(401, "Unauthorized"));
    const getEnvelopesApi = (await import("../../services/docusignClient.js")).default;

    await expect(getEnvelopesApi()).rejects.toThrow(/userinfo failed/i);
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

```
cd server && npx vitest run tests/services/docusignClient.token.test.js
```
Expected: FAIL. The current `docusignClient.js` uses `apiClient.requestJWTUserToken()` (not `fetch`), so `fetchSpy` is never called and assertions like `expect(fetchSpy).toHaveBeenCalledTimes(1)` fail (or the SDK call hangs/throws). This proves the test exercises the new contract.

- [ ] **Step 3: Commit the failing test**

```bash
git add server/tests/services/docusignClient.token.test.js
git commit -m "test: failing tests for fetch-based DocuSign JWT token acquisition"
```

---

## Task 2: Rewrite docusignClient.js to mint the token via jsonwebtoken + fetch

**Files:**
- Modify: `server/services/docusignClient.js` (full rewrite of internals; export + warning block preserved)

- [ ] **Step 1: Read the current file to preserve the warning block verbatim**

```
cd server && cat services/docusignClient.js
```
The top-of-file env-warning block (the `if (!privateKeyB64) { console.warn(...) } else if (...) { console.warn(...) }`) and the module-level `const privateKeyB64 = process.env.DS_PRIVATE_KEY_B64 ?? process.env.DS_PRIVATE_KEY_B;` line MUST stay byte-for-byte identical — `docusignClient.envWarning.test.js` asserts on these exact warnings.

- [ ] **Step 2: Replace the file with the rewrite**

Write `server/services/docusignClient.js` with exactly this content:

```js
import docusign from "docusign-esign";
import jwt from "jsonwebtoken";

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

let cached = {
  accessToken: null,
  expiresAt: 0,
  accountId: process.env.DS_ACCOUNT_ID,
  apiClient: null,
};

// DS_OAUTH_BASE must be the host only (e.g. "account-d.docusign.com"), no scheme.
function oauthBase() {
  return `https://${process.env.DS_OAUTH_BASE}`;
}

// Mint a DocuSign JWT access token via a signed RS256 assertion + the OAuth
// token endpoint. Replaces docusign-esign requestJWTUserToken(), whose
// callback-based HTTP path crashes the Node 22 process on any error.
async function mintAccessToken() {
  const keyB64 = process.env.DS_PRIVATE_KEY_B64 ?? process.env.DS_PRIVATE_KEY_B;
  if (!keyB64) {
    throw new Error(
      "DocuSign private key is not configured (DS_PRIVATE_KEY_B64)"
    );
  }
  const pem = Buffer.from(keyB64, "base64").toString("utf8");

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: process.env.DS_INTEGRATION_KEY,
      sub: process.env.DS_USER_ID,
      aud: process.env.DS_OAUTH_BASE,
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    },
    pem,
    { algorithm: "RS256" }
  );

  const res = await fetch(`${oauthBase()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" +
      assertion,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error("DocuSign auth failed: " + bodyText);
  }

  const json = await res.json();
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in || 3600,
  };
}

// Resolve the DocuSign account id via /oauth/userinfo. Only used when
// DS_ACCOUNT_ID is not set. DocuSign userinfo uses snake_case.
async function resolveAccountId(accessToken) {
  const res = await fetch(`${oauthBase()}/oauth/userinfo`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error("DocuSign userinfo failed: " + bodyText);
  }

  const json = await res.json();
  const accounts = json.accounts || [];
  if (accounts.length === 0) {
    throw new Error("DocuSign userinfo returned no accounts");
  }
  const acct =
    accounts.find(
      (a) => a.is_default === true || a.is_default === "true"
    ) || accounts[0];
  return acct.account_id;
}

async function ensureToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.accessToken && now < cached.expiresAt - 60) return cached;

  const { accessToken, expiresIn } = await mintAccessToken();

  let accountId = process.env.DS_ACCOUNT_ID || cached.accountId;
  if (!accountId) {
    accountId = await resolveAccountId(accessToken);
  }

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DS_BASE_PATH);
  apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  cached = {
    accessToken,
    expiresAt: now + expiresIn,
    accountId,
    apiClient,
  };
  return cached;
}

export default async function getEnvelopesApi() {
  const { apiClient, accountId } = await ensureToken();
  return { envelopesApi: new docusign.EnvelopesApi(apiClient), accountId };
}
```

- [ ] **Step 3: Run the new test, confirm it passes**

```
cd server && npx vitest run tests/services/docusignClient.token.test.js
```
Expected: PASS — all 6 cases green.

- [ ] **Step 4: Run the env-warning regression, confirm still green**

```
cd server && npx vitest run tests/services/docusignClient.envWarning.test.js
```
Expected: PASS, unchanged. (If it fails, the warning block was altered — restore it byte-for-byte.)

- [ ] **Step 5: Commit the fix**

```bash
git add server/services/docusignClient.js
git commit -m "fix: mint DocuSign JWT token via jsonwebtoken+fetch (bypass crashing SDK path)"
```

---

## Task 3: Full regression, lint, push, PR

**Files:** none (verification + delivery)

- [ ] **Step 1: Run the full server test suite**

```
cd server && npm test
```
Expected: all tests pass, **0 regressions** vs. the `origin/main` baseline. The two docusignClient test files are green; nothing else changed so nothing else should break.

- [ ] **Step 2: Lint**

```
cd server && npm run lint
```
Expected: no new warnings/errors introduced by the changed file or the new test file. (Pre-existing repo lint state is acceptable; this task must not add new findings in `docusignClient.js` or `docusignClient.token.test.js`.)

- [ ] **Step 3: Sanity-check the export contract is unchanged**

```
cd server && node --input-type=module -e "import('./services/docusignClient.js').then(m => console.log(typeof m.default))"
```
Expected output: `function` (the default export `getEnvelopesApi` is still a function; callers `leaseService`, `gateService`, `app.js /docusign/ping` are untouched and remain compatible).

- [ ] **Step 4: Push the branch**

```bash
git push -u origin claude/fix-docusign-jwt
```

- [ ] **Step 5: Open the PR**

```bash
gh pr create --title "Fix: DocuSign JWT token acquisition (bypass crashing docusign-esign SDK path)" --body "$(cat <<'EOF'
## Problem
`docusign-esign`'s `requestJWTUserToken()` crashes the Node 22 process at `ApiClient.js:132` (`callback is not a function`) on any token-acquisition error, restarting the whole Render service and masking the real DocuSign error. Credentials were verified correct via a local raw JWT+fetch reproduction that returns a valid token.

## Fix
Replace the broken SDK auth calls in `server/services/docusignClient.js`:
- `mintAccessToken()` — `jsonwebtoken` RS256 assertion + `fetch` to `/oauth/token`.
- `resolveAccountId()` — `fetch` to `/oauth/userinfo` (replaces the same broken SDK path; only used when `DS_ACCOUNT_ID` unset).
- Token failures now throw a clean `Error` carrying DocuSign's real message; the process never crashes. `/docusign/ping` returns `{ok:false,error:"<real error>"}` instead of dying.
- `EnvelopesApi` and the `getEnvelopesApi()` export signature are unchanged — zero downstream changes.
- Module-level env-warning block preserved verbatim (F-207 test stays green).

## Tests
- New `docusignClient.token.test.js`: happy path, token caching, real-error-surfaced (consent_required) without crash, missing-key, accountId via userinfo, userinfo failure.
- `docusignClient.envWarning.test.js` unchanged and green.
- Full `npm test` suite: 0 regressions.

Spec: docs/superpowers/specs/2026-05-17-docusign-jwt-token-fix-design.md
Plan: docs/superpowers/plans/2026-05-17-docusign-jwt-token-fix.md
EOF
)"
```

- [ ] **Step 6: Report the PR URL**

Output the PR URL so the user can review and merge, then redeploy Render off updated `main`.

---

## Notes for the executor

- **Do not modify** `docusignClient.envWarning.test.js`, the module-level warning block, or any caller. The fix lives entirely behind the unchanged `getEnvelopesApi()` default export.
- **`DS_OAUTH_BASE` is host-only** (no `https://`). `oauthBase()` prepends the scheme. Tests set `DS_OAUTH_BASE="account-d.docusign.com"`.
- **`tests/setup.js` global env**: it sets `DS_PRIVATE_KEY_B="dGVzdC1rZXk="` (not a valid PEM) and `DS_ACCOUNT_ID="test-account"`. The token test deliberately overrides `DS_PRIVATE_KEY_B64` with a real generated RSA key and sets/deletes `DS_ACCOUNT_ID` per case — keep that setup intact.
- **TDD discipline**: Task 1 must show the test failing before Task 2 implements. If Task 1's test unexpectedly passes against the old code, stop — the test isn't pinning the new behavior; fix the test first.
- **`jsonwebtoken` import style**: ESM default import (`import jwt from "jsonwebtoken";`) — matches how `server/middleware/authentication.js` imports it. Do not add it to package.json (already `^9.0.2`).
- This is a 3-task hotfix; if any step balloons beyond its description, that's a signal to re-check the spec rather than widen scope.
