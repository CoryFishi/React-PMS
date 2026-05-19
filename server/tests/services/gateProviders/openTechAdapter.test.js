import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.OPENTECH_CLIENT_ID = "test-client-id";
  process.env.OPENTECH_CLIENT_SECRET = "test-client-secret";
  process.env.OPENTECH_ENV = "dev";
});

afterEach(() => {
  delete global.fetch;
});

async function loadAdapter() {
  vi.resetModules();
  return (await import("../../../services/gateProviders/openTechAdapter.js")).default;
}

function makeFacility() {
  return {
    _id: "f1",
    company: {
      _id: "c1",
      gateProviders: { opentech: { apiKey: "ak", apiSecret: "as" } },
    },
    gateProviderRefs: { opentech: { facilityId: "remote_f1" } },
  };
}

describe("openTechAdapter — auth", () => {
  it("posts form-encoded grant_type=password to dev auth URL on first call", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ access_token: "tok1", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    const authCall = fetchMock.mock.calls[0];
    expect(authCall[0]).toBe("https://auth.insomniaccia-dev.com/auth/token");
    expect(authCall[1].method).toBe("POST");
    expect(authCall[1].headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = authCall[1].body;
    expect(body).toContain("grant_type=password");
    expect(body).toContain("username=ak");
    expect(body).toContain("password=as");
    expect(body).toContain("client_id=test-client-id");
    expect(body).toContain("client_secret=test-client-secret");
  });

  it("includes the OpenTech response body in the thrown auth error", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_client"}',
      json: async () => ({ error: "invalid_client" }),
    });

    await expect(
      adapter.listTimeGroups({ facility: makeFacility() })
    ).rejects.toThrow(/OpenTech auth failed: 400.*invalid_client/);
  });

  it("calls the OpenTech timegroups/accessprofiles paths (no hyphens)", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    await adapter.listTimeGroups({ facility: makeFacility() });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/timegroups"
    );

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ access_token: "tok2", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    const adapter2 = await loadAdapter();
    await adapter2.listAccessProfiles({ facility: makeFacility() });
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/accessprofiles"
    );
  });

  it("reuses cached JWT on second call within TTL", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-cache", expires_in: 60 }),
    });
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    const facility = makeFacility();
    await adapter.listTimeGroups({ facility });
    await adapter.listTimeGroups({ facility });
    await adapter.listTimeGroups({ facility });

    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(1);
  });

  it("isolates JWT cache between companies", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-A", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok-B", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    const facilityA = makeFacility();
    const facilityB = { ...makeFacility(), company: { ...makeFacility().company, _id: "c2" } };

    await adapter.listTimeGroups({ facility: facilityA });
    await adapter.listTimeGroups({ facility: facilityB });

    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(2);
  });

  it("refreshes token and retries once on 401", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "old-tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "expired", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "fresh-tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => [{ id: "tg1", name: "24x7", isDefault: true }],
    });

    const result = await adapter.listTimeGroups({ facility: makeFacility() });
    expect(result).toEqual([{ id: "tg1", name: "24x7", isDefault: true }]);
    const authCalls = fetchMock.mock.calls.filter((c) => c[0].includes("/auth/token"));
    expect(authCalls).toHaveLength(2);
  });

  it("backs off and retries on 5XX, then succeeds", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down", json: async () => ({}) });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => [{ id: "tg1", name: "24x7", isDefault: true }],
    });

    const result = await adapter.listTimeGroups({ facility: makeFacility() });
    expect(result).toHaveLength(1);
  });

  it("includes api-version: 2.0 header on Access Control calls", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    const accessCall = fetchMock.mock.calls.find((c) => c[0].includes("/facilities/"));
    expect(accessCall[1].headers["api-version"]).toBe("2.0");
    expect(accessCall[1].headers.Authorization).toMatch(/^Bearer /);
  });

  it("uses prod base URL when OPENTECH_ENV=prod", async () => {
    process.env.OPENTECH_ENV = "prod";
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });

    await adapter.listTimeGroups({ facility: makeFacility() });

    expect(fetchMock.mock.calls[0][0]).toContain("auth.insomniaccia.com");
    expect(fetchMock.mock.calls[0][0]).not.toContain("-dev");
  });
});

describe("openTechAdapter — provisionTenant", () => {
  function provisionFacility() {
    return {
      _id: "f1",
      company: {
        _id: "c1",
        gateProviders: { opentech: { apiKey: "ak", apiSecret: "as" } },
      },
      gateProviderRefs: {
        opentech: {
          facilityId: "remote_f1",
          defaultTimeGroupId: "5",
          defaultAccessProfileId: "7",
        },
      },
      __unitRef: { gateProviderRefs: { opentech: { unitId: "42" } } },
    };
  }

  it("sends numeric ids and reads visitor id from VisitorResponseModel", async () => {
    const adapter = await loadAdapter();
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ access_token: "tok", expires_in: 60 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ visitor: { id: 987 }, unit: { id: 42 } }),
    });

    const result = await adapter.provisionTenant({
      facility: provisionFacility(),
      rental: {},
      tenant: { firstName: "Jane", lastName: "Doe", contactInfo: { phone: "555" } },
      accessCode: "12345678",
    });

    expect(result.visitorId).toBe("987");
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toBe(
      "https://accesscontrol.insomniaccia-dev.com/facilities/remote_f1/visitors"
    );
    const sent = JSON.parse(postCall[1].body);
    expect(sent.unitId).toBe(42);
    expect(sent.timeGroupId).toBe(5);
    expect(sent.accessProfileId).toBe(7);
    expect(typeof sent.unitId).toBe("number");
    expect(sent.firstName).toBe("Jane");
    expect(sent.lastName).toBe("Doe");
    expect(sent.isTenant).toBe(true);
  });
});
