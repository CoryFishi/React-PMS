import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("GET /tenants — F-002 regression", () => {
  it("returns the tenants that exist (not an empty array)", async () => {
    await makeTenant();
    await makeTenant();
    const res = await api(app)
      .get("/tenants")
      .set("Cookie", adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // The response body IS the array directly (res.json(tenants))
    const tenants = Array.isArray(res.body) ? res.body : res.body.tenants;
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBeGreaterThanOrEqual(2);
  });
});

describe("DELETE /tenants/delete — F-004 regression", () => {
  it("deletes a tenant who has no units rented", async () => {
    const tenant = await makeTenant();
    // deleteTenant reads tenantId from req.query, not req.body
    const res = await api(app)
      .delete("/tenants/delete")
      .set("Cookie", adminCookie)
      .query({ tenantId: tenant._id.toString() });
    // Accept any 2xx (controller uses 200)
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const stillThere = await Tenant.findById(tenant._id);
    expect(stillThere).toBeNull();
  });

  it("refuses to delete a tenant who has units rented (409)", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const tenant = await makeTenant();
    await makeUnit(facility, { tenant: tenant._id, status: "Rented" });
    const res = await api(app)
      .delete("/tenants/delete")
      .set("Cookie", adminCookie)
      .query({ tenantId: tenant._id.toString() });
    expect(res.status).toBe(409);
    const stillThere = await Tenant.findById(tenant._id);
    expect(stillThere).not.toBeNull();
  });
});
