import docusign from "docusign-esign";

let cached = {
  accessToken: null,
  expiresAt: 0,
  accountId: process.env.DS_ACCOUNT_ID,
  apiClient: null,
};

async function ensureToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.accessToken && now < cached.expiresAt - 60) return cached;

  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DS_BASE_PATH);

  const jwtRes = await apiClient.requestJWTUserToken(
    process.env.DS_INTEGRATION_KEY,
    process.env.DS_USER_ID,
    process.env.DS_OAUTH_BASE,
    Buffer.from(process.env.DS_PRIVATE_KEY_B64, "base64"),
    3600,
    ["signature", "impersonation"]
  );

  const accessToken = jwtRes.body.access_token;
  const expiresIn = jwtRes.body.expires_in; // seconds
  apiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  // Get/confirm accountId if not set
  let accountId = cached.accountId;
  if (!accountId) {
    const userInfo = await apiClient.getUserInfo(accessToken);
    const acct =
      userInfo?.accounts?.find(
        (a) => a.isDefault === "true" || a.isDefault === true
      ) || userInfo.accounts?.[0];
    accountId = acct?.accountId;
  }

  cached = {
    accessToken,
    expiresAt: now + (expiresIn || 3600),
    accountId,
    apiClient,
  };
  return cached;
}

export default async function getEnvelopesApi() {
  const { apiClient, accountId } = await ensureToken();
  return { envelopesApi: new docusign.EnvelopesApi(apiClient), accountId };
}
