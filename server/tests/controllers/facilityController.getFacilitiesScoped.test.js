import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility } from "../helpers/factories.js";

let app;

beforeEach(async () => {
  app = buildApp();
});

describe("F-206 getFacilities scoping", () => {
  it("Company_Admin sees only their company's facilities", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();
    const facA = await makeFacility(companyA);
    const facB = await makeFacility(companyB);

    const userA = await makeUser({ role: "Company_Admin", company: companyA._id });
    const cookieA = cookieFor({ id: userA._id.toString(), role: userA.role });

    const res = await api(app).get("/facilities").set("Cookie", cookieA);
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : (res.body.facilities ?? res.body.data ?? []);
    const ids = list.map((f) => f._id.toString());
    expect(ids).toContain(facA._id.toString());
    expect(ids).not.toContain(facB._id.toString());
  });

  it("System_Admin sees facilities from every company", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();
    const facA = await makeFacility(companyA);
    const facB = await makeFacility(companyB);

    const sysAdmin = await makeUser({ role: "System_Admin" });
    const cookie = cookieFor({ id: sysAdmin._id.toString(), role: sysAdmin.role });

    const res = await api(app).get("/facilities").set("Cookie", cookie);
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : (res.body.facilities ?? res.body.data ?? []);
    const ids = list.map((f) => f._id.toString());
    expect(ids).toEqual(expect.arrayContaining([facA._id.toString(), facB._id.toString()]));
  });
});
