import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-101 companyRoutes: static segments do not collide with /:companyId", () => {
  it("GET /companies/:companyId resolves to the company-by-id handler", async () => {
    const company = await makeCompany();

    const res = await api(app)
      .get(`/companies/${company._id.toString()}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
  });

  it("static POST /companies/create still routes to createCompany", async () => {
    const res = await api(app)
      .post(`/companies/create`)
      .set("Cookie", adminCookie)
      .send({});

    expect(res.status).not.toBe(404);
  });

  it("static DELETE /companies/delete still routes to deleteCompany", async () => {
    // Pass a syntactically invalid id so mongoose throws a CastError → controller
    // returns 400, proving the route was reached (unmatched route → Express 404 HTML).
    const res = await api(app)
      .delete(`/companies/delete`)
      .set("Cookie", adminCookie)
      .query({ id: "not-an-objectid" });

    expect(res.status).not.toBe(404);
  });

  it("static PUT /companies/update still routes to editCompany", async () => {
    // Pass a syntactically invalid companyId so mongoose throws a CastError → controller
    // returns 500, proving the route was reached (unmatched route → Express 404 HTML).
    const res = await api(app)
      .put(`/companies/update`)
      .set("Cookie", adminCookie)
      .query({ companyId: "not-an-objectid" });

    expect(res.status).not.toBe(404);
  });
});
