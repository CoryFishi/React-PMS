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

// DS_OAUTH_BASE must be host-only (e.g. "account-d.docusign.com", no scheme).
function oauthBase() {
  return `https://${process.env.DS_OAUTH_BASE}`;
}

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
    accounts.find((a) => a.is_default === true || a.is_default === "true") ||
    accounts[0];
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
