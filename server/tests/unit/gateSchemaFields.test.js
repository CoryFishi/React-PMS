import { describe, it, expect } from "vitest";
import Company from "../../models/company.js";
import StorageFacility from "../../models/facility.js";
import StorageUnit from "../../models/unit.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Gate schema — Company / Facility / StorageUnit", () => {
  it("Company accepts gateProviders.opentech credentials", async () => {
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k1", apiSecret: "s1" } },
    });
    const reloaded = await Company.findById(c._id);
    expect(reloaded.gateProviders.opentech.apiKey).toBe("k1");
    expect(reloaded.gateProviders.opentech.apiSecret).toBe("s1");
  });

  it("Facility accepts gateProvider + gateProviderRefs.opentech.* including time groups + access profiles", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: {
        opentech: {
          facilityId: "f_remote",
          timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
          accessProfiles: [{ id: "ap1", name: "All Access", isDefault: true }],
          defaultTimeGroupId: "tg1",
          defaultAccessProfileId: "ap1",
          syncedAt: new Date(),
        },
      },
    });
    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProvider).toBe("opentech");
    expect(reloaded.gateProviderRefs.opentech.facilityId).toBe("f_remote");
    expect(reloaded.gateProviderRefs.opentech.timeGroups).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.defaultTimeGroupId).toBe("tg1");
  });

  it("StorageUnit accepts gateProviderRefs.opentech.unitId", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f, {
      gateProviderRefs: { opentech: { unitId: "u_remote" } },
    });
    const reloaded = await StorageUnit.findById(u._id);
    expect(reloaded.gateProviderRefs.opentech.unitId).toBe("u_remote");
  });

  it("Facility rejects an unknown gateProvider value", async () => {
    const c = await makeCompany();
    await expect(
      StorageFacility.create({
        company: c._id,
        facilityName: "X",
        status: "Enabled",
        address: { street1: "1", city: "X", state: "TX", zipCode: "00000", country: "US" },
        contactInfo: { phone: "5550100000", email: "x@example.com" },
        createdBy: c.createdBy,
        gateProvider: "bogus",
      })
    ).rejects.toThrow();
  });
});
