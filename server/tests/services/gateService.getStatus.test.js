import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";

const { healthCheck } = vi.hoisted(() => ({ healthCheck: vi.fn() }));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(),
    listAccessProfiles: vi.fn(),
    provisionTenant: vi.fn(),
    revokeTenant: vi.fn(),
    suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(),
    healthCheck,
  },
}));

import { getStatus } from "../../services/gateService.js";

beforeEach(() => {
  healthCheck.mockReset();
});

describe("gateService.getStatus", () => {
  it("returns null provider shape when facility has no gateProvider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const result = await getStatus({ facilityId: f._id });
    expect(result.provider).toBe(null);
    expect(result.timeGroups).toEqual([]);
    expect(result.accessProfiles).toEqual([]);
  });

  it("returns synced lists + current defaults so the UI can render dropdowns", async () => {
    healthCheck.mockResolvedValue({ ok: true });
    const c = await makeCompany({
      gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } },
    });
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: {
        opentech: {
          facilityId: "remote_f",
          timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
          accessProfiles: [{ id: "ap1", name: "All", isDefault: true }],
          defaultTimeGroupId: "tg1",
          defaultAccessProfileId: "ap1",
          syncedAt: new Date("2026-05-18"),
        },
      },
    });

    const result = await getStatus({ facilityId: f._id });

    expect(result.provider).toBe("opentech");
    expect(result.adapterHealthy).toBe(true);
    expect(result.timeGroups).toHaveLength(1);
    expect(result.timeGroups[0].id).toBe("tg1");
    expect(result.accessProfiles[0].id).toBe("ap1");
    expect(result.defaultTimeGroupId).toBe("tg1");
    expect(result.defaultAccessProfileId).toBe("ap1");
    expect(result.lastSyncedAt).toBeInstanceOf(Date);
  });
});
