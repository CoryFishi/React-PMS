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

describe("POST /users/register — F-301 null guard on facilities + role precedence", () => {
  it("returns a clean 4xx, not 500, when neither role nor facilities is supplied", async () => {
    const res = await api(app)
      .post("/users/register")
      .set("Cookie", adminCookie)
      .send({
        name: "Missing Role",
        displayName: "miss",
        email: `mr-${Date.now()}@example.com`,
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
        // role and facilities both omitted
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("returns a clean 4xx, not 500, when role is Company_User but facilities is omitted", async () => {
    const company = await makeCompany();
    const res = await api(app)
      .post("/users/register")
      .set("Cookie", adminCookie)
      .send({
        name: "Company User No Fac",
        displayName: "cunf",
        email: `cunf-${Date.now()}@example.com`,
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
        role: "Company_User",
        company: company._id.toString(),
        // facilities omitted — triggers Object.keys(undefined) TypeError without the null guard
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
