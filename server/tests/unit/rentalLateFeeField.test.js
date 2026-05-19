// server/tests/unit/rentalLateFeeField.test.js
import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant, makeRental } from "../helpers/factories.js";

describe("Rental.lateFeeAppliedAt", () => {
  it("defaults to null and accepts a Date", async () => {
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
    expect(r.lateFeeAppliedAt ?? null).toBeNull();
    r.lateFeeAppliedAt = new Date("2026-05-18");
    await r.save();
    expect(r.lateFeeAppliedAt.toISOString()).toContain("2026-05-18");
  });
});
