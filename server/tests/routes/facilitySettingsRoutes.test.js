// server/tests/routes/facilitySettingsRoutes.test.js
import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

let app;
beforeEach(() => { app = buildApp(); });

describe("settings route auth layers", () => {
  it("rejects without API key", async () => {
    const res = await supertest(app).get("/facilities/abc/settings");
    expect([401, 403]).toContain(res.status);
  });

  it("401 with API key but no JWT cookie", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app).get(`/facilities/${f._id}/settings`);
    expect(res.status).toBe(401);
  });

  it("403 for an authenticated Company_User", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const cu = await makeUser({ role: "Company_User", company: c._id });
    const res = await api(app)
      .get(`/facilities/${f._id}/settings`)
      .set("Cookie", cookieFor({ id: cu._id.toString() }));
    expect(res.status).toBe(403);
  });

  it("200 for System_Admin", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const admin = await makeUser({ role: "System_Admin" });
    const res = await api(app)
      .get(`/facilities/${f._id}/settings`)
      .set("Cookie", cookieFor({ id: admin._id.toString() }));
    expect(res.status).toBe(200);
  });
});
