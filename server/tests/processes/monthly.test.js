import { describe, it, expect } from "vitest";
import { updateTenantBalance } from "../../processes/monthly.js";
import Tenant from "../../models/tenant.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";

describe("processes/monthly — F-209 regression", () => {
  it("increments tenant balance by paymentInfo.pricePerMonth (not NaN)", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility, { paymentInfo: { pricePerMonth: 175 } });
    const tenant = await makeTenant({ company: company._id });

    // Attach unit to tenant and set status to one monthly.js scans for.
    // Use updateOne to bypass the tenant.status enum (which doesn't include "Rented").
    await Tenant.updateOne(
      { _id: tenant._id },
      { $set: { units: [unit._id], status: "Rented", balance: 0 } },
      { runValidators: false }
    );

    await updateTenantBalance({ disconnect: false });

    // Use raw collection read because `balance` is not in the Tenant schema.
    const raw = await Tenant.collection.findOne({ _id: tenant._id });
    expect(raw.balance).toBe(175);
    expect(Number.isNaN(raw.balance)).toBe(false);
  });

  it("sums prices across multiple rented units", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unitA = await makeUnit(facility, { paymentInfo: { pricePerMonth: 100 } });
    const unitB = await makeUnit(facility, { paymentInfo: { pricePerMonth: 50 } });
    const tenant = await makeTenant({ company: company._id });

    await Tenant.updateOne(
      { _id: tenant._id },
      { $set: { units: [unitA._id, unitB._id], status: "Delinquent", balance: 0 } },
      { runValidators: false }
    );

    await updateTenantBalance({ disconnect: false });

    const raw = await Tenant.collection.findOne({ _id: tenant._id });
    expect(raw.balance).toBe(150);
  });
});
