import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: vi.fn(),
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { syncFacilityResources } from "../../services/gateService.js";

let app, cookie;
beforeEach(async () => {
  syncFacilityResources.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /facilities/:facilityId/gate/sync", () => {
  it("200 with counts on happy path", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    syncFacilityResources.mockResolvedValue({ noop: false, timeGroups: 3, accessProfiles: 2 });

    const res = await api(app).post(`/facilities/${f._id}/gate/sync`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ timeGroups: 3, accessProfiles: 2 });
    expect(syncFacilityResources).toHaveBeenCalledWith({ facilityId: f._id.toString() });
  });

  it("502 when adapter auth fails", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    syncFacilityResources.mockRejectedValue(new Error("OpenTech auth failed: 400"));

    const res = await api(app).post(`/facilities/${f._id}/gate/sync`).set("Cookie", cookie);
    expect(res.status).toBe(502);
  });

  it("surfaces the underlying adapter error message on generic failure", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    syncFacilityResources.mockRejectedValue(
      new Error("OpenTech GET /facilities/999/time-groups failed: 404 not found")
    );

    const res = await api(app).post(`/facilities/${f._id}/gate/sync`).set("Cookie", cookie);
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/time-groups failed: 404/);
  });
});
