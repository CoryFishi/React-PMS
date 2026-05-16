import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import {
  makeCompany,
  makeFacility,
  makeTenant,
  makeUser,
} from "../helpers/factories.js";

let app;

beforeEach(async () => {
  app = buildApp();
});

describe("getDashboardData — F-106 regression: company scoping", () => {
  it("Company_Admin only sees their own company's tenants/facilities", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();

    // Facilities — one per company.
    await makeFacility(companyA);
    await makeFacility(companyB);

    // Tenants — one per company.
    await makeTenant({ company: companyA._id });
    await makeTenant({ company: companyB._id });

    // Company_Admin in company A.
    const admin = await makeUser({
      role: "Company_Admin",
      company: companyA._id,
    });
    const cookie = cookieFor({ id: admin._id.toString(), role: admin.role });

    const res = await api(app)
      .get("/dashboard/overview")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    // Tenants: 1 in company A (not 2 globally).
    expect(res.body.tenants.total).toBe(1);
    // Facilities: 1 in company A (not 2 globally).
    expect(res.body.facilities.total).toBe(1);
  });

  it("System_Admin sees global counts", async () => {
    const companyA = await makeCompany();
    const companyB = await makeCompany();
    await makeFacility(companyA);
    await makeFacility(companyB);
    await makeTenant({ company: companyA._id });
    await makeTenant({ company: companyB._id });

    const sysAdmin = await makeUser({ role: "System_Admin" });
    const cookie = cookieFor({
      id: sysAdmin._id.toString(),
      role: sysAdmin.role,
    });

    const res = await api(app)
      .get("/dashboard/overview")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.tenants.total).toBe(2);
    expect(res.body.facilities.total).toBe(2);
  });
});

describe("getDashboardData — extended metrics", () => {
  it("returns revenue, occupancy, rentals and a 6-month activity trend", async () => {
    const company = await makeCompany();
    await makeFacility(company);

    const admin = await makeUser({
      role: "Company_Admin",
      company: company._id,
    });
    const cookie = cookieFor({ id: admin._id.toString(), role: admin.role });

    const res = await api(app)
      .get("/dashboard/overview")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);

    // Revenue defaults to zero with no paid rentals.
    expect(res.body.revenue).toMatchObject({ total: 0, last30: 0 });

    // Occupancy is derived from unit counts.
    expect(res.body.occupancy).toMatchObject({
      occupancyRate: 0,
      delinquencyRate: 0,
    });

    // Leasing funnel is present even when empty.
    expect(res.body.rentals.byStatus).toEqual({});
    expect(res.body.rentals.signing).toEqual({});

    // Trend is a continuous, zero-filled 6-month window.
    expect(res.body.activityTrend).toHaveLength(6);
    expect(res.body.revenue.trend).toHaveLength(6);
    res.body.activityTrend.forEach((p) => {
      expect(p).toHaveProperty("month");
      expect(p).toHaveProperty("value");
    });
  });
});
