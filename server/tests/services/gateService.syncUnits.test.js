import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import StorageUnit from "../../models/unit.js";
import Event from "../../models/event.js";

const { listUnits, createUnit, vacateUnit, deleteVacantUnit } = vi.hoisted(() => ({
  listUnits: vi.fn(), createUnit: vi.fn(), vacateUnit: vi.fn(), deleteVacantUnit: vi.fn(),
}));

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(), healthCheck: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(), suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(), listUnits, createUnit, vacateUnit, deleteVacantUnit,
  },
}));

import { syncUnits } from "../../services/gateService.js";

beforeEach(() => {
  listUnits.mockReset(); createUnit.mockReset();
  vacateUnit.mockReset(); deleteVacantUnit.mockReset();
});

async function linked() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return { c, f };
}

describe("gateService.syncUnits — happy path", () => {
  it("creates missing in OpenTech, vacate+deletes extras, repairs matched ids", async () => {
    const { f } = await linked();
    const a1 = await makeUnit(f, { unitNumber: "A1" }); // matched, no unitId yet
    await makeUnit(f, { unitNumber: "A2" });            // missing in OpenTech
    listUnits.mockResolvedValue([
      { id: "11", unitNumber: "A1", status: "Vacant" }, // matched -> repair id
      { id: "99", unitNumber: "Z9", status: "Vacant" }, // extra -> vacate+delete
    ]);
    createUnit.mockResolvedValue({ id: "22" });
    vacateUnit.mockResolvedValue();
    deleteVacantUnit.mockResolvedValue();

    const res = await syncUnits({ facilityId: f._id });

    expect(res.status).toBe("in-sync");
    expect(res.created).toBe(1);
    expect(res.deleted).toBe(1);
    expect(res.matched).toBe(1);
    expect(res.errors).toEqual([]);

    expect(createUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitNumber: "A2" });
    expect(vacateUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitId: "99" });
    expect(deleteVacantUnit).toHaveBeenCalledWith({ facility: expect.anything(), unitId: "99" });

    const reA1 = await StorageUnit.findById(a1._id);
    expect(reA1.gateProviderRefs.opentech.unitId).toBe("11");
    const reA2 = await StorageUnit.findOne({ facility: f._id, unitNumber: "A2" });
    expect(reA2.gateProviderRefs.opentech.unitId).toBe("22");

    const events = await Event.find({ facility: f._id, eventType: "Integration" });
    const names = events.map((e) => e.eventName);
    expect(names).toContain("Gate Unit Created");
    expect(names).toContain("Gate Unit Deleted");
    expect(names).toContain("Gate Unit Sync");
  });
});
