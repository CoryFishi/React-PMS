import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const sessionsCreate = vi.fn();
const pricesRetrieve = vi.fn();

vi.mock("../../services/stripeConnect.js", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: sessionsCreate } },
    prices: { retrieve: pricesRetrieve },
  }),
  assertStripeReadyForCompany: vi.fn(async (companyId) => {
    const Company = (await import("../../models/company.js")).default;
    return Company.findById(companyId);
  }),
}));

import { startRental } from "../../services/leaseService.js";

beforeEach(async () => {
  sessionsCreate.mockReset();
  pricesRetrieve.mockReset();
});

describe("leaseService.startRental", () => {
  it("creates a Stripe session, persists a Rental linked to the Tenant, returns checkoutUrl", async () => {
    const company = await makeCompany({ stripe: { accountId: "acct_x", onboardingComplete: true } });
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility, { stripe: { accountId: "acct_x", priceId: "price_123", currency: "usd" } });
    const tenant = await makeTenant({ company: company._id });

    pricesRetrieve.mockResolvedValue({ unit_amount: 10000, currency: "usd", type: "one_time", active: true });
    sessionsCreate.mockResolvedValue({ id: "cs_test_abc", url: "https://stripe.example/checkout/abc" });

    const { checkoutUrl, rentalId } = await startRental({
      company,
      facility,
      unit,
      tenant,
      successUrl: "https://app.example.test/success",
      cancelUrl: "https://app.example.test/cancel",
    });

    expect(checkoutUrl).toBe("https://stripe.example/checkout/abc");
    expect(typeof rentalId).toBe("string");

    const rental = await Rental.findById(rentalId);
    expect(rental).not.toBeNull();
    expect(rental.tenant.toString()).toBe(tenant._id.toString());
    expect(rental.status).toBe("pending");
    expect(rental.signingStatus).toBe("unsent");
    expect(rental.checkoutSessionId).toBe("cs_test_abc");
    expect(rental.amount).toBe(100);
  });

  it("throws if the unit has no Stripe price", async () => {
    const company = await makeCompany({ stripe: { accountId: "acct_x", onboardingComplete: true } });
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility, { stripe: undefined });
    const tenant = await makeTenant({ company: company._id });

    await expect(
      startRental({ company, facility, unit, tenant, successUrl: "x", cancelUrl: "y" })
    ).rejects.toThrow(/price/i);
  });
});
