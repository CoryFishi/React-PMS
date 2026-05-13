import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeTenant } from "../helpers/factories.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-006: tenant routes require JWT", () => {
  it("GET /tenants returns 401 with API key but no JWT cookie", async () => {
    const res = await api(app).get("/tenants");
    expect(res.status).toBe(401);
  });

  it("GET /tenants returns 200 with API key + valid JWT", async () => {
    await makeTenant();
    const res = await api(app).get("/tenants").set("Cookie", adminCookie);
    expect(res.status).toBe(200);
  });

  it("GET /tenants returns 401 with no API key", async () => {
    const res = await supertest(app).get("/tenants").set("Cookie", adminCookie);
    expect(res.status).toBe(401);
  });

  it("POST /tenants/create returns 401 without JWT", async () => {
    const res = await api(app).post("/tenants/create").send({ firstName: "X" });
    expect(res.status).toBe(401);
  });

  it("DELETE /tenants/delete returns 401 without JWT", async () => {
    const res = await api(app).delete("/tenants/delete").query({ tenantId: "abc" });
    expect(res.status).toBe(401);
  });
});

describe("F-006: payment routes (decision: public — rental-center flow)", () => {
  // POST /payments/unit-checkout-session is called by the anonymous RentalCheckout
  // component with only an API key (no JWT). The handler reads tenantEmail/unitId
  // from req.body; it never touches req.user. Keeping it API-key-only is intentional.
  it("POST /payments/unit-checkout-session accepts request without JWT cookie (no 401)", async () => {
    // We expect 400/404/409/500 (missing body / unit not found / Stripe not configured)
    // but NOT 401 — the route is intentionally public for the anonymous rental flow.
    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send({ unitId: "000000000000000000000000" });
    expect(res.status).not.toBe(401);
  });

  // POST /payments/create is also invoked from the rental flow with just an API key.
  it("POST /payments/create accepts request without JWT cookie (no 401)", async () => {
    const res = await api(app)
      .post("/payments/create")
      .send({ unitId: "000000000000000000000000", tenantId: "000000000000000000000000" });
    expect(res.status).not.toBe(401);
  });
});
