import { describe, it, expect } from "vitest";
import Rental from "../../models/rental.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Rental schema — gate fields", () => {
  it("accepts gateProviderRefs.opentech + gateProvisionError", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      gateProviderRefs: { opentech: { visitorId: "v_1", accessCode: "12345678", provisionedAt: new Date() } },
      gateProvisionError: "test error",
    });

    expect(rental.gateProviderRefs.opentech.visitorId).toBe("v_1");
    expect(rental.gateProviderRefs.opentech.accessCode).toBe("12345678");
    expect(rental.gateProviderRefs.opentech.provisionedAt).toBeInstanceOf(Date);
    expect(rental.gateProvisionError).toBe("test error");
  });
});
