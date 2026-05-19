// server/tests/middleware/requireFacilityAdmin.test.js
import { describe, it, expect, vi } from "vitest";
import requireFacilityAdmin from "../../middleware/requireFacilityAdmin.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

function res() {
  return {
    statusCode: 0,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe("requireFacilityAdmin", () => {
  it("allows System_Admin", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const admin = await makeUser({ role: "System_Admin" });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: admin._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows Company_Admin of the same company", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const ca = await makeUser({ role: "Company_Admin", company: c._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: ca._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("403s a Company_Admin from a different company", async () => {
    const c1 = await makeCompany();
    const c2 = await makeCompany();
    const f = await makeFacility(c1);
    const ca = await makeUser({ role: "Company_Admin", company: c2._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: ca._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).not.toHaveBeenCalled();
    expect(r.statusCode).toBe(403);
  });

  it("403s a Company_User", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const cu = await makeUser({ role: "Company_User", company: c._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: cu._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(r.statusCode).toBe(403);
  });

  it("401s when no authenticated user id", async () => {
    const req = { params: { facilityId: "x" }, user: {} };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(r.statusCode).toBe(401);
  });
});
