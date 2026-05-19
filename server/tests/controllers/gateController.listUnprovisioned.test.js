import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

const listMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: vi.fn(),
  listUnprovisioned: listMock,
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

let app, cookie;
beforeEach(async () => {
  listMock.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /facilities/:facilityId/gate/unprovisioned", () => {
  it("returns the rentals array", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    listMock.mockResolvedValue([
      {
        _id: "r1",
        tenantName: "Jane Doe",
        unitNumber: "A2",
        gateProvisionError: "OpenTech 500",
        signedAt: new Date("2026-05-18"),
      },
    ]);

    const res = await api(app)
      .get(`/facilities/${f._id}/gate/unprovisioned`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.rentals).toHaveLength(1);
    expect(res.body.rentals[0].tenantName).toBe("Jane Doe");
  });

  it("returns 404 when the facility is not found", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    listMock.mockRejectedValue(new Error("Facility not found"));

    const res = await api(app)
      .get(`/facilities/${f._id}/gate/unprovisioned`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
  });
});
