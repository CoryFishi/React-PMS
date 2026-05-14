import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

import { handleCheckoutCompleted } from "../../services/paymentService.js";

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "pending",
    checkoutSessionId: "cs_test_abc",
    ...overrides,
  });
  return { rental, company, facility, tenant };
}

describe("paymentService.handleCheckoutCompleted", () => {
  it("returns noop when no Rental exists for the given session id", async () => {
    const result = await handleCheckoutCompleted({ sessionId: "cs_missing", paymentIntentId: "pi_x" });
    expect(result).toEqual({ noop: true, reason: "rental-not-found" });
  });

  it("transitions pending -> paid, persists paymentIntentId, writes Payment Recieved Event", async () => {
    const { rental, company } = await seedRental();

    const result = await handleCheckoutCompleted({ sessionId: "cs_test_abc", paymentIntentId: "pi_test_xyz" });

    expect(result).toEqual({ noop: false });

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.status).toBe("paid");
    expect(refreshed.paymentIntentId).toBe("pi_test_xyz");

    const events = await Event.find({ eventName: "Payment Recieved", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("is idempotent: re-call on an already-paid Rental returns noop and does not double-write Event", async () => {
    const { rental } = await seedRental({ status: "paid", paymentIntentId: "pi_existing" });

    const result = await handleCheckoutCompleted({ sessionId: "cs_test_abc", paymentIntentId: "pi_test_xyz" });

    expect(result).toEqual({ noop: true, reason: "already-applied" });

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.paymentIntentId).toBe("pi_existing");
    expect(await Event.countDocuments({ eventName: "Payment Recieved" })).toBe(0);
  });
});
