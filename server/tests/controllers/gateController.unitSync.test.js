import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

const { checkUnitSync, syncUnits } = vi.hoisted(() => ({
  checkUnitSync: vi.fn(), syncUnits: vi.fn(),
}));

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(), getStatus: vi.fn(),
  listUnprovisioned: vi.fn(), provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: vi.fn(), unsuspendUnit: vi.fn(), retryProvisionTenant: vi.fn(),
  linkFacility: vi.fn(), unlinkFacility: vi.fn(),
  checkUnitSync, syncUnits,
}));

let app, cookie;
beforeEach(async () => {
  checkUnitSync.mockReset(); syncUnits.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /facilities/:facilityId/gate/units/status", () => {
  it("200 with status payload", async () => {
    const f = await makeFacility(await makeCompany());
    checkUnitSync.mockResolvedValue({ status: "out-of-sync", missing: ["A2"], extra: [], matched: 3 });
    const res = await api(app).get(`/facilities/${f._id}/gate/units/status`).set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("out-of-sync");
  });

  it("400 when not linked", async () => {
    const f = await makeFacility(await makeCompany());
    checkUnitSync.mockRejectedValue(new Error("Facility not linked to OpenTech"));
    const res = await api(app).get(`/facilities/${f._id}/gate/units/status`).set("Cookie", cookie);
    expect(res.status).toBe(400);
  });
});

describe("POST /facilities/:facilityId/gate/units/sync", () => {
  it("200 on success", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ status: "in-sync", created: 1, deleted: 0, matched: 2, errors: [] });
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(1);
    expect(syncUnits).toHaveBeenCalledWith({ facilityId: f._id.toString(), force: false });
  });

  it("409 when guard-blocked, passing counts", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ blocked: true, wouldCreate: 0, wouldDelete: 9 });
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(409);
    expect(res.body.wouldDelete).toBe(9);
  });

  it("passes force:true through", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockResolvedValue({ status: "in-sync", created: 0, deleted: 9, matched: 0, errors: [] });
    await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({ force: true });
    expect(syncUnits).toHaveBeenCalledWith({ facilityId: f._id.toString(), force: true });
  });

  it("502 surfaces adapter failure message", async () => {
    const f = await makeFacility(await makeCompany());
    syncUnits.mockRejectedValue(new Error("OpenTech GET /facilities/1/units failed: 500"));
    const res = await api(app).post(`/facilities/${f._id}/gate/units/sync`).set("Cookie", cookie).send({});
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/units failed: 500/);
  });
});
