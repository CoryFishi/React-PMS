import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";
import Company from "../../models/company.js";

const { accountsCreate, accountsDel } = vi.hoisted(() => ({
  accountsCreate: vi.fn(),
  accountsDel: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: () => ({
    accounts: { create: accountsCreate, del: accountsDel },
  }),
}));

let app, adminCookie;

beforeEach(async () => {
  accountsCreate.mockReset();
  accountsDel.mockReset();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /companies/create — F-105 Stripe orphan cleanup", () => {
  it("calls stripe.accounts.del when Mongo insert fails on duplicate companyName", async () => {
    accountsCreate.mockResolvedValue({ id: "acct_orphan_123" });

    const existing = await makeCompany({ companyName: "Duplicate Inc" });

    const res = await api(app)
      .post("/companies/create")
      .set("Cookie", adminCookie)
      .send({
        companyName: existing.companyName,
        address: { street1: "1 X", city: "Y", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { email: "x@example.com" },
      });

    expect(res.status).toBe(409);
    expect(accountsDel).toHaveBeenCalledWith("acct_orphan_123");

    const all = await Company.find({ companyName: existing.companyName });
    expect(all).toHaveLength(1);
    expect(all[0]._id.toString()).toBe(existing._id.toString());
  });

  it("does not call stripe.accounts.del on success", async () => {
    accountsCreate.mockResolvedValue({ id: "acct_happy_path" });

    const res = await api(app)
      .post("/companies/create")
      .set("Cookie", adminCookie)
      .send({
        companyName: "Brand New Co",
        address: { street1: "1 X", city: "Y", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { email: "x@example.com" },
      });

    expect(res.status).toBe(201);
    expect(accountsDel).not.toHaveBeenCalled();
  });
});
