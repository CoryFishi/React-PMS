import { describe, it, expect } from "vitest";
import {
  makeCompany,
  makeFacility,
  makeUnit,
  makeTenant,
} from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import { listUnprovisioned } from "../../services/gateService.js";

async function seedRental(facility, company, overrides = {}) {
  const unit = await makeUnit(facility, { unitNumber: overrides.unitNumber });
  const tenant = await makeTenant({ company: company._id });
  return Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    tenantName: overrides.tenantName || "Jane Doe",
    amount: 100,
    status: "paid",
    signingStatus: overrides.signingStatus || "signed",
    signedAt: new Date("2026-05-18"),
    ...(overrides.rental || {}),
  });
}

describe("gateService.listUnprovisioned", () => {
  it("returns empty list when facility has no gateProvider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const result = await listUnprovisioned({ facilityId: f._id });
    expect(result).toEqual([]);
  });

  it("includes signed rentals missing a visitorId or carrying a gateProvisionError, excludes provisioned ones", async () => {
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } },
    });
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: { opentech: { facilityId: "remote_f" } },
    });

    // included: signed, no visitorId
    await seedRental(f, c, { tenantName: "No Visitor", unitNumber: "A1" });
    // included: signed, has visitorId but errored
    await seedRental(f, c, {
      tenantName: "Errored",
      unitNumber: "A2",
      rental: {
        gateProviderRefs: { opentech: { visitorId: "v1" } },
        gateProvisionError: "OpenTech 500",
      },
    });
    // excluded: signed + provisioned cleanly
    await seedRental(f, c, {
      tenantName: "Clean",
      unitNumber: "A3",
      rental: { gateProviderRefs: { opentech: { visitorId: "v2" } } },
    });
    // excluded: not signed
    await seedRental(f, c, {
      tenantName: "Unsigned",
      unitNumber: "A4",
      signingStatus: "sent",
    });

    const result = await listUnprovisioned({ facilityId: f._id });
    const names = result.map((r) => r.tenantName).sort();
    expect(names).toEqual(["Errored", "No Visitor"]);
    const errored = result.find((r) => r.tenantName === "Errored");
    expect(errored.gateProvisionError).toBe("OpenTech 500");
    expect(errored.unitNumber).toBe("A2");
    expect(errored._id).toBeTruthy();
  });

  it("throws when facility not found", async () => {
    await expect(
      listUnprovisioned({ facilityId: "64b2f0000000000000000000" })
    ).rejects.toThrow("Facility not found");
  });
});
