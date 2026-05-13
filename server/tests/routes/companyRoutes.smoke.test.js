import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeUser } from "../helpers/factories.js";

describe("GET /companies (smoke)", () => {
  it("401 without api key", async () => {
    const res = await supertest(buildApp()).get("/companies");
    expect(res.status).toBe(401);
  });

  it("401 with api key but no cookie", async () => {
    const res = await api(buildApp()).get("/companies");
    expect(res.status).toBe(401);
  });

  it("200 when api key + valid cookie for a System_Admin user", async () => {
    const user = await makeUser({ role: "System_Admin" });
    await makeCompany();
    const res = await api(buildApp())
      .get("/companies")
      .set("Cookie", cookieFor({ id: user._id.toString(), role: user.role }));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
