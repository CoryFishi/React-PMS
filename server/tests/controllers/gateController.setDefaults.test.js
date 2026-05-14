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

import { setDefaults } from "../../services/gateService.js";

let app, cookie;
beforeEach(async () => {
  setDefaults.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("PUT /facilities/:facilityId/gate/defaults", () => {
  it("200 on happy path", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    setDefaults.mockResolvedValue({ noop: false });

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/defaults`)
      .set("Cookie", cookie)
      .send({ defaultTimeGroupId: "tg1", defaultAccessProfileId: "ap1" });

    expect(res.status).toBe(200);
  });

  it("400 when service rejects unknown IDs", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    setDefaults.mockRejectedValue(new Error("Time group / access profile not in synced list — run /sync first"));

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/defaults`)
      .set("Cookie", cookie)
      .send({ defaultTimeGroupId: "bogus", defaultAccessProfileId: "bogus" });

    expect(res.status).toBe(400);
  });
});
