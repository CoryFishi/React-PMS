import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

const { listTimeGroups, listAccessProfiles } = vi.hoisted(() => ({
  listTimeGroups: vi.fn(),
  listAccessProfiles: vi.fn(),
}));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups,
    listAccessProfiles,
    provisionTenant: vi.fn(),
    revokeTenant: vi.fn(),
    suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(),
    healthCheck: vi.fn(),
  },
}));

import { syncFacilityResources } from "../../services/gateService.js";

beforeEach(() => {
  listTimeGroups.mockReset();
  listAccessProfiles.mockReset();
});

describe("gateService.syncFacilityResources", () => {
  it("returns noop when facility has no gateProvider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const result = await syncFacilityResources({ facilityId: f._id });
    expect(result).toEqual({ noop: true, reason: "no-provider" });
    expect(listTimeGroups).not.toHaveBeenCalled();
  });

  it("populates timeGroups + accessProfiles + syncedAt on the Facility doc", async () => {
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } },
    });
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: { opentech: { facilityId: "remote_f" } },
    });

    listTimeGroups.mockResolvedValue([{ id: "tg1", name: "24x7", isDefault: true }]);
    listAccessProfiles.mockResolvedValue([{ id: "ap1", name: "All", isDefault: true }]);

    const result = await syncFacilityResources({ facilityId: f._id });
    expect(result.noop).toBe(false);

    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProviderRefs.opentech.timeGroups).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.timeGroups[0].id).toBe("tg1");
    expect(reloaded.gateProviderRefs.opentech.accessProfiles).toHaveLength(1);
    expect(reloaded.gateProviderRefs.opentech.syncedAt).toBeInstanceOf(Date);
  });
});
