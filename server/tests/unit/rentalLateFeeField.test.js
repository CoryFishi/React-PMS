// server/tests/unit/rentalLateFeeField.test.js
import { describe, it, expect } from "vitest";
import Rental from "../../models/rental.js";
import { makeCompany, makeFacility, makeUnit, makeTenant, makeRental } from "../helpers/factories.js";

describe("Rental.lateFeeAppliedAt", () => {
  it("defaults to null and persists a Date through a DB round-trip", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const t = await makeTenant({ company: c._id });
    const r = await makeRental(u, t, {
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      status: "paid",
    });

    const fresh = await Rental.findById(r._id);
    expect(fresh.lateFeeAppliedAt).toBeNull();

    fresh.lateFeeAppliedAt = new Date("2026-05-18T00:00:00.000Z");
    await fresh.save();

    const reloaded = await Rental.findById(r._id);
    expect(reloaded.lateFeeAppliedAt).toBeInstanceOf(Date);
    expect(reloaded.lateFeeAppliedAt.toISOString()).toBe("2026-05-18T00:00:00.000Z");
  });
});
