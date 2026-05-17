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
