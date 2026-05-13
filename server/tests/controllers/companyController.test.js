import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, oid } from "../helpers/factories.js";
import Company from "../../models/company.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("PUT /companies/update — F-008 mass-assignment regression", () => {
  it("ignores attacker-supplied stripe.onboardingComplete and stripe.accountId", async () => {
    const company = await makeCompany();

    const hostilePayload = {
      companyName: "Renamed Co",
      stripe: { accountId: "acct_hostile", onboardingComplete: true },
      createdBy: oid(),
    };

    const res = await api(app)
      .put(`/companies/update`)
      .set("Cookie", adminCookie)
      .query({ companyId: company._id.toString() })
      .send(hostilePayload);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const stored = await Company.findById(company._id);
    expect(stored).not.toBeNull();

    // Legitimate field update should apply
    expect(stored.companyName).toBe("Renamed Co");

    // Stripe fields must not be writable from client:
    expect(stored.stripe?.accountId).not.toBe("acct_hostile");
    expect(stored.stripe?.onboardingComplete).not.toBe(true);

    // createdBy must not be changed
    expect(stored.createdBy.toString()).toBe(company.createdBy.toString());
  });

  it("ignores attacker-supplied 'status' field when user is not System_Admin", async () => {
    const companyAdminUser = await makeUser({ role: "Company_Admin" });
    const companyCookie = cookieFor({ id: companyAdminUser._id.toString(), role: companyAdminUser.role });
    const company = await makeCompany({ status: "Enabled" });

    const hostilePayload = {
      companyName: company.companyName,
      status: "Disabled",  // Company_Admin must not be able to change status
    };

    await api(app)
      .put(`/companies/update`)
      .set("Cookie", companyCookie)
      .query({ companyId: company._id.toString() })
      .send(hostilePayload);

    // Whether 200 or 403 — the status must not change
    const stored = await Company.findById(company._id);
    expect(stored).not.toBeNull();
    expect(stored.status).toBe("Enabled");
  });
});
