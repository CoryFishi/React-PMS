import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

const { listUnits } = vi.hoisted(() => ({ listUnits: vi.fn() }));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(), healthCheck: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(), suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(), listUnits, createUnit: vi.fn(),
    vacateUnit: vi.fn(), deleteVacantUnit: vi.fn(),
  },
}));

import { checkUnitSync } from "../../services/gateService.js";

beforeEach(() => listUnits.mockReset());

async function linkedFacility() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return { c, f };
}

describe("gateService.checkUnitSync", () => {
  it("throws when facility not linked", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    await expect(checkUnitSync({ facilityId: f._id })).rejects.toThrow("Facility not linked to OpenTech");
  });

  it("reports out-of-sync and caches counts on the facility", async () => {
    const { f } = await linkedFacility();
    await makeUnit(f, { unitNumber: "A1" }); // matched
    await makeUnit(f, { unitNumber: "A2" }); // missing in OpenTech
    listUnits.mockResolvedValue([
      { id: "11", unitNumber: "A1", status: "Vacant" }, // matched
      { id: "99", unitNumber: "Z9", status: "Vacant" }, // extra in OpenTech
    ]);

    const res = await checkUnitSync({ facilityId: f._id });

    expect(res.status).toBe("out-of-sync");
    expect(res.missing).toEqual(["A2"]);
    expect(res.extra).toEqual(["Z9"]);
    expect(res.matched).toBe(1);

    const reloaded = await StorageFacility.findById(f._id);
    const us = reloaded.gateProviderRefs.opentech.unitSync;
    expect(us.status).toBe("out-of-sync");
    expect(us.missing).toBe(1);
    expect(us.extra).toBe(1);
    expect(us.matched).toBe(1);
    expect(us.lastCheckedAt).toBeInstanceOf(Date);
  });

  it("reports in-sync when sets match (case/space-insensitive)", async () => {
    const { f } = await linkedFacility();
    await makeUnit(f, { unitNumber: "A1" });
    listUnits.mockResolvedValue([{ id: "11", unitNumber: " a1 ", status: "Vacant" }]);

    const res = await checkUnitSync({ facilityId: f._id });
    expect(res.status).toBe("in-sync");
  });
});
