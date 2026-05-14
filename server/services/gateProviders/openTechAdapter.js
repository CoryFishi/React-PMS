const tokenCache = new Map(); // companyId -> { token, expiresAt }

const BASE = (svc) => {
  const env = process.env.OPENTECH_ENV === "dev" ? "insomniaccia-dev.com" : "insomniaccia.com";
  return `https://${svc}.${env}`;
};

const AUTH_BASE = () => BASE("auth");
const ACCESS_BASE = () => BASE("accesscontrol");

async function getToken(company) {
  const companyId = String(company._id);
  const cached = tokenCache.get(companyId);
  const now = Date.now();
  if (cached && cached.expiresAt - 60_000 > now) return cached.token;

  const body = new URLSearchParams({
    grant_type: "password",
    username: company.gateProviders?.opentech?.apiKey || "",
    password: company.gateProviders?.opentech?.apiSecret || "",
    client_id: process.env.OPENTECH_CLIENT_ID || "",
    client_secret: process.env.OPENTECH_CLIENT_SECRET || "",
  }).toString();

  const res = await fetch(`${AUTH_BASE()}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`OpenTech auth failed: ${res.status}`);
  }
  const json = await res.json();
  // Docs say expires_in is "number of minutes"
  const ttlMs = (json.expires_in || 60) * 60 * 1000;
  tokenCache.set(companyId, { token: json.access_token, expiresAt: now + ttlMs });
  return json.access_token;
}

function backoffSchedule() {
  return (process.env.GATE_RETRY_BACKOFF_MS || "1000,2000,4000")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function authedRequest(method, path, { facility, body, query } = {}) {
  const company = facility.company;
  let token = await getToken(company);
  const url = new URL(`${ACCESS_BASE()}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const baseInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "api-version": "2.0",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let attempt = 0;
  const schedule = backoffSchedule();
  while (true) {
    let res;
    try {
      res = await fetch(url.toString(), baseInit);
    } catch (netErr) {
      if (attempt >= schedule.length) throw netErr;
      await sleep(schedule[attempt]);
      attempt += 1;
      continue;
    }
    if (res.status === 401 && attempt === 0) {
      tokenCache.delete(String(company._id));
      token = await getToken(company);
      baseInit.headers.Authorization = `Bearer ${token}`;
      attempt += 1;
      continue;
    }
    if (res.status >= 500 && attempt < schedule.length) {
      await sleep(schedule[attempt]);
      attempt += 1;
      continue;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`OpenTech ${method} ${path} failed: ${res.status} ${text}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }
}

const openTechAdapter = {
  async listTimeGroups({ facility }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)");
    const items = await authedRequest("GET", `/facilities/${fid}/time-groups`, { facility });
    return (items || []).map((g) => ({ id: String(g.id), name: g.name, isDefault: !!g.isDefault }));
  },
  async listAccessProfiles({ facility }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    if (!fid) throw new Error("Facility not linked to OpenTech (set gateProviderRefs.opentech.facilityId)");
    const items = await authedRequest("GET", `/facilities/${fid}/access-profiles`, { facility });
    return (items || []).map((p) => ({ id: String(p.id), name: p.name, isDefault: !!p.isDefault }));
  },
  async healthCheck({ facility }) {
    try {
      await authedRequest("GET", "/facilities", { facility });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  async provisionTenant({ facility, rental: _rental, tenant, accessCode }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const unitId = facility?.__unitRef?.gateProviderRefs?.opentech?.unitId;
    if (!fid) throw new Error("Facility not linked to OpenTech");
    if (!unitId) throw new Error("Unit not linked to OpenTech");
    const tg = facility.gateProviderRefs?.opentech?.defaultTimeGroupId;
    const ap = facility.gateProviderRefs?.opentech?.defaultAccessProfileId;
    if (!tg || !ap) throw new Error("Gate defaults not configured");
    const body = {
      isTenant: true,
      unitId,
      accessCode,
      timeGroupId: tg,
      accessProfileId: ap,
      firstName: tenant?.firstName,
      lastName: tenant?.lastName,
      mobilePhoneNumber: tenant?.contactInfo?.phone,
    };
    const result = await authedRequest("POST", `/facilities/${fid}/visitors`, { facility, body });
    return { visitorId: String(result.id || result.visitorId || result._id) };
  },
  async revokeTenant({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    await authedRequest("POST", `/facilities/${fid}/units/${uid}/vacate`, { facility, body: {} });
  },
  async suspendUnit({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    try {
      await authedRequest("POST", `/facilities/${fid}/units/${uid}/disable`, { facility, body: {} });
    } catch (e) {
      if (e.status === 400 && /already/i.test(e.body || "")) return;
      throw e;
    }
  },
  async unsuspendUnit({ facility, unit }) {
    const fid = facility.gateProviderRefs?.opentech?.facilityId;
    const uid = unit?.gateProviderRefs?.opentech?.unitId;
    if (!fid || !uid) return;
    try {
      await authedRequest("POST", `/facilities/${fid}/units/${uid}/enable`, { facility, body: {} });
    } catch (e) {
      if (e.status === 400 && /already/i.test(e.body || "")) return;
      throw e;
    }
  },
};

export default openTechAdapter;
