# DocuSign JWT Token Acquisition Fix — Design

**Date:** 2026-05-17
**Branch:** `claude/fix-docusign-jwt` (worktree `.claude/worktrees/fix-docusign-jwt`, off `origin/main` @ 60bd471)
**Type:** Production hotfix — single-file change.

## Problem

`server/services/docusignClient.js` acquires its DocuSign JWT access token via the `docusign-esign` SDK's `apiClient.requestJWTUserToken()`. On the production runtime (Node v22.12.0, Render), that SDK call routes through `docusign-esign/src/ApiClient.js:132`, whose callback-based HTTP error path executes `callback(err)` where `callback` is `undefined`. The resulting `TypeError: callback is not a function` is **uncaught**, crashes the entire Node process, and Render restarts the service. The `await requestJWTUserToken(...)` separately resolves to `undefined`, so `jwtRes.body` at `docusignClient.js:38` throws `Cannot read properties of undefined (reading 'body')`. Net effect: every DocuSign token acquisition crashes the whole API server and the real DocuSign error is never surfaced.

Credentials are verified correct. A local reproduction that builds the JWT assertion with `jsonwebtoken` and POSTs directly to the OAuth token endpoint with `fetch` returns a valid `access_token`:

```
DOCUSIGN SAYS: {"access_token":"eyJ0...","token_type":"Bearer","expires_in":3600,"scope":"signature impersonation"}
```

So the defect is purely the SDK's broken JWT-token HTTP path under Node 22, not configuration.

The same broken `ApiClient.js` HTTP layer also backs `apiClient.getUserInfo()`, which `ensureToken()` calls when `DS_ACCOUNT_ID` is unset — a latent identical crash.

## Goal

Remove both broken SDK auth calls (`requestJWTUserToken`, `getUserInfo`) from `docusignClient.js`. Acquire the token (and, if needed, the account id) via the locally-proven raw approach: `jsonwebtoken` RS256 assertion + `fetch` to the DocuSign OAuth endpoints. Keep `docusign-esign` `EnvelopesApi` for envelope operations (never in the crash path). Preserve the `getEnvelopesApi()` export signature so no caller changes.

## Locked-in decisions

| Decision | Choice |
|---|---|
| Error behavior on token-fetch failure | Throw a clean `Error` carrying DocuSign's real error text; never crash the process (option A). No stale-token fallback, no typed error class. |
| `getUserInfo()` | Also replaced with a direct `fetch` to `/oauth/userinfo` (same broken SDK path; in scope). |
| `EnvelopesApi` | Unchanged — still `docusign-esign`; never in the crash path. |
| Public interface | `getEnvelopesApi()` unchanged: returns `{ envelopesApi, accountId }`. Zero downstream changes. |
| Env-warning block | Unchanged (keeps `docusignClient.envWarning.test.js` green). |

## Architecture

Single file: `server/services/docusignClient.js`. Imports add `jsonwebtoken`; `fetch` is the Node 22 global. `docusign-esign` is still imported (for `ApiClient` as a Bearer-header carrier and `EnvelopesApi`).

```
getEnvelopesApi()                      (export, unchanged signature)
   └─ ensureToken()                    (cache + TTL, rewritten internals)
        ├─ mintAccessToken()           NEW — jwt.sign + fetch /oauth/token
        ├─ resolveAccountId(token)     NEW — fetch /oauth/userinfo (only if DS_ACCOUNT_ID unset)
        └─ builds docusign.ApiClient   (basePath + "Authorization: Bearer <token>" default header)
   returns { envelopesApi: new docusign.EnvelopesApi(apiClient), accountId }
```

## Components

### `mintAccessToken()` — new internal async function

1. `const privateKeyB64 = process.env.DS_PRIVATE_KEY_B64 ?? process.env.DS_PRIVATE_KEY_B;`
   If falsy → `throw new Error("DocuSign private key is not configured (DS_PRIVATE_KEY_B64)")`.
2. `const pem = Buffer.from(privateKeyB64, "base64").toString("utf8");`
3. Build assertion:
   ```js
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
   ```
4. `POST https://${process.env.DS_OAUTH_BASE}/oauth/token`
   - headers: `{ "Content-Type": "application/x-www-form-urlencoded" }`
   - body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
5. If `!res.ok`: read body text, `throw new Error("DocuSign auth failed: " + bodyText)` (surfaces `consent_required` / `invalid_grant` / etc.).
6. Parse JSON → return `{ accessToken: json.access_token, expiresIn: json.expires_in || 3600 }`.

### `resolveAccountId(accessToken)` — new internal async function

Only invoked when `process.env.DS_ACCOUNT_ID` is unset.
- `GET https://${process.env.DS_OAUTH_BASE}/oauth/userinfo`, header `Authorization: Bearer ${accessToken}`.
- `!res.ok` → `throw new Error("DocuSign userinfo failed: " + bodyText)`.
- Parse JSON; from `json.accounts`, pick the entry where `is_default === true` (or `"true"`), else first; return its `account_id`.
- If no accounts → `throw new Error("DocuSign userinfo returned no accounts")`.

(Note DocuSign `/oauth/userinfo` uses snake_case `accounts[].account_id` / `is_default`, unlike the SDK's camelCase — handle the raw shape.)

### `ensureToken()` — rewritten body, same caching contract

```
const now = Math.floor(Date.now()/1000);
if (cached.accessToken && now < cached.expiresAt - 60) return cached;

const { accessToken, expiresIn } = await mintAccessToken();

let accountId = process.env.DS_ACCOUNT_ID || cached.accountId;
if (!accountId) accountId = await resolveAccountId(accessToken);

const apiClient = new docusign.ApiClient();
apiClient.setBasePath(process.env.DS_BASE_PATH);
apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

cached = { accessToken, expiresAt: now + expiresIn, accountId, apiClient };
return cached;
```

No `try/catch` that swallows — errors propagate as rejected promises (clean, non-fatal).

### `getEnvelopesApi()` — unchanged

```
const { apiClient, accountId } = await ensureToken();
return { envelopesApi: new docusign.EnvelopesApi(apiClient), accountId };
```

### Top-of-file env-warning block — unchanged

Keep verbatim so `docusignClient.envWarning.test.js` passes without modification.

## Error flow

`mintAccessToken`/`resolveAccountId` throw → `ensureToken` rejects → `getEnvelopesApi` rejects → existing callers:
- `GET /docusign/ping` (`server/app.js`) — its `try/catch` returns `{ ok:false, error: e.message }` (now the **real** DocuSign error). No crash.
- `leaseService` envelope/gate hooks — already wrapped in `.catch()`; degrade as designed.
- DocuSign Connect webhook controller — returns 500; DocuSign retries.

No path calls `process.exit` or leaves an unhandled rejection; the process stays up.

## Testing

New file: `server/tests/services/docusignClient.token.test.js`.

Setup: generate an ephemeral RSA keypair in-test (`node:crypto generateKeyPairSync("rsa", { modulusLength: 2048 })`), base64 the private PEM into `process.env.DS_PRIVATE_KEY_B64`; set `DS_INTEGRATION_KEY`, `DS_USER_ID`, `DS_OAUTH_BASE`, `DS_BASE_PATH`. Mock global `fetch` per-test. `vi.resetModules()` between tests so the module-level `cached` resets.

Cases:
1. **Happy path** — `/oauth/token` → 200 `{access_token:"tok", expires_in:3600}`; `DS_ACCOUNT_ID` set. `getEnvelopesApi()` resolves; `accountId` equals env value; `envelopesApi` is a `docusign.EnvelopesApi`; the token POST was form-urlencoded with `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`.
2. **Token cached** — two `getEnvelopesApi()` calls within TTL → `fetch` called once for `/oauth/token`.
3. **Real error surfaced, no crash** — `/oauth/token` → 400 `{"error":"consent_required"}`. `await expect(getEnvelopesApi()).rejects.toThrow(/consent_required/)`. (Asserts the rejection is a normal promise rejection, not a thrown/uncaught crash.)
4. **Missing key** — unset `DS_PRIVATE_KEY_B64`/`DS_PRIVATE_KEY_B` → rejects with `/private key is not configured/`.
5. **Account id resolution** — `DS_ACCOUNT_ID` unset; `/oauth/token` → 200; `/oauth/userinfo` → 200 `{accounts:[{account_id:"acc-1",is_default:true}]}`. `accountId === "acc-1"`.
6. **userinfo failure** — `DS_ACCOUNT_ID` unset; `/oauth/userinfo` → 401 → rejects with `/userinfo failed/`.

Regression: `server/tests/services/docusignClient.envWarning.test.js` must pass unchanged. Full `npm test` suite: 0 regressions.

## Out of scope

- Replacing `docusign-esign` `EnvelopesApi` (createEnvelope / createRecipientView / getDocument) — not in the crash path.
- Stale-token fallback, typed error classes (rejected options B/C).
- Retry/backoff on the token fetch — DocuSign Connect and Stripe webhooks already retry; envelope/gate hooks already degrade. Can be a later hardening follow-up.
- Any change to `/docusign/ping` or other callers — fix is entirely behind the unchanged `getEnvelopesApi()` interface.
- Upgrading the `docusign-esign` dependency version — larger blast radius; the targeted bypass is the safe hotfix.

## Risks

- **`DS_OAUTH_BASE` must be host-only** (e.g. `account-d.docusign.com`, no scheme). Code prepends `https://`. This matches the existing env convention and the locally-proven script; add an inline comment noting it.
- **base64 PEM round-trip** — `Buffer.from(b64,"base64").toString("utf8")` then RS256 sign is exactly the locally-verified path; low risk. A BOM-corrupted key would fail `jwt.sign` with a clear error (surfaced, not crashed).
- **`/oauth/userinfo` shape** — snake_case (`account_id`, `is_default`) differs from the SDK's camelCase; handled explicitly. Low traffic (only when `DS_ACCOUNT_ID` unset; production sets it).
