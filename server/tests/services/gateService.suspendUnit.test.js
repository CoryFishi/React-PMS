import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import Event from "../../models/event.js";

const suspendUnitMock = vi.hoisted(() => vi.fn());
const unsuspendUnitMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(),
    provisionTenant: vi.fn(), revokeTenant: vi.fn(),
    suspendUnit: suspendUnitMock, unsuspendUnit: unsuspendUnitMock, healthCheck: vi.fn(),
  },
}));

import { suspendUnit, unsuspendUnit } from "../../services/gateService.js";

beforeEach(() => {
  suspendUnitMock.mockReset();
  unsuspendUnitMock.mockReset();
});

async function seedUnit() {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  return makeUnit(f, { gateProviderRefs: { opentech: { unitId: "remote_u" } } });
}

describe("gateService.suspendUnit / unsuspendUnit", () => {
  it("suspend calls adapter and writes Event", async () => {
    const u = await seedUnit();
    suspendUnitMock.mockResolvedValue();
    const result = await suspendUnit({ unitId: u._id });
    expect(result.noop).toBe(false);
    expect(suspendUnitMock).toHaveBeenCalledTimes(1);
    expect(await Event.countDocuments({ eventName: "Gate Suspended" })).toBe(1);
  });

  it("unsuspend calls adapter and writes Event", async () => {
    const u = await seedUnit();
    unsuspendUnitMock.mockResolvedValue();
    const result = await unsuspendUnit({ unitId: u._id });
    expect(result.noop).toBe(false);
    expect(unsuspendUnitMock).toHaveBeenCalledTimes(1);
    expect(await Event.countDocuments({ eventName: "Gate Unsuspended" })).toBe(1);
  });

  it("no-op when facility has no provider", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const result = await suspendUnit({ unitId: u._id });
    expect(result.noop).toBe(true);
    expect(suspendUnitMock).not.toHaveBeenCalled();
  });
});
