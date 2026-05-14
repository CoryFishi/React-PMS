import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

const statusMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: statusMock,
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

let app, cookie;
beforeEach(async () => {
  statusMock.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /facilities/:facilityId/gate/status", () => {
  it("returns the status shape", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    statusMock.mockResolvedValue({
      provider: "opentech",
      adapterHealthy: true,
      lastSyncedAt: new Date("2026-05-14"),
      unprovisionedRentalCount: 2,
    });

    const res = await api(app).get(`/facilities/${f._id}/gate/status`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.adapterHealthy).toBe(true);
    expect(res.body.unprovisionedRentalCount).toBe(2);
  });
});
