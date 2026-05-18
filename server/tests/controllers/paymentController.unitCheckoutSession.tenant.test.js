import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));
vi.mock("../../services/stripeConnect.js", () => ({
  getStripeClient: vi.fn(() => ({})),
  assertStripeReadyForCompany: vi.fn(),
}));

import { startRental } from "../../services/leaseService.js";
import { assertStripeReadyForCompany } from "../../services/stripeConnect.js";
import Rental from "../../models/rental.js";

let app;
let company;
let facility;
let unit;

beforeEach(async () => {
  startRental.mockReset();
  assertStripeReadyForCompany.mockReset();
  app = buildApp();

  company = await makeCompany();
  facility = await makeFacility(company);
  unit = await makeUnit(facility);

  assertStripeReadyForCompany.mockResolvedValue({
    _id: company._id,
    stripe: { accountId: "acct_test", onboardingComplete: true },
  });

  startRental.mockImplementation(async () => {
    const rental = await Rental.create({
      company: company._id,
      facility: facility._id,
      unit: unit._id,
      tenant: undefined,
      amount: 100,
      currency: "usd",
      checkoutSessionId: `cs_${Date.now()}`,
      status: "pending",
      signingStatus: "unsent",
    });
    return { checkoutUrl: "https://stripe.example/c/x", rentalId: rental._id };
  });
});

function payload(extra = {}) {
  return {
    unitId: String(unit._id),
    tenantEmail: "shim@example.com",
    tenantName: "Shim Name",
    successUrl: "https://app.example.test/s",
    cancelUrl: "https://app.example.test/c",
    ...extra,
  };
}

describe("POST /payments/unit-checkout-session — tenant binding", () => {
  it("uses the real Tenant when a valid tenantId is provided", async () => {
    const tenant = await makeTenant({
      company: company._id,
      firstName: "Real",
      lastName: "Person",
      contactInfo: { email: "real@example.com" },
    });

    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload({ tenantId: String(tenant._id) }));

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(String(arg.tenant._id)).toBe(String(tenant._id));
    expect(arg.tenant.contactInfo.email).toBe("real@example.com");
  });

  it("falls back to the shim when tenantId is absent", async () => {
    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload());

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(arg.tenant.contactInfo.email).toBe("shim@example.com");
  });

  it("falls back to the shim when tenantId is present but not found", async () => {
    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload({ tenantId: "64b2f0000000000000000000" }));

    expect(res.status).toBe(200);
    expect(startRental).toHaveBeenCalledTimes(1);
    const arg = startRental.mock.calls[0][0];
    expect(arg.tenant.contactInfo.email).toBe("shim@example.com");
  });

  it("returns 403 when the tenant belongs to a different company", async () => {
    const otherCompany = await makeCompany();
    const otherTenant = await makeTenant({
      company: otherCompany._id,
      firstName: "Other",
      lastName: "Co",
      contactInfo: { email: "other@example.com" },
    });

    const res = await api(app)
      .post("/payments/unit-checkout-session")
      .send(payload({ tenantId: String(otherTenant._id) }));

    expect(res.status).toBe(403);
    expect(startRental).not.toHaveBeenCalled();
  });
});
