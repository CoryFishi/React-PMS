import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

const revokeTenantMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(), listAccessProfiles: vi.fn(),
    provisionTenant: vi.fn(),
    revokeTenant: revokeTenantMock,
    suspendUnit: vi.fn(), unsuspendUnit: vi.fn(), healthCheck: vi.fn(),
  },
}));

import { revokeTenant } from "../../services/gateService.js";

beforeEach(() => revokeTenantMock.mockReset());

async function seed(rentalOverrides = {}) {
  const c = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const f = await makeFacility(c, {
    gateProvider: "opentech",
    gateProviderRefs: { opentech: { facilityId: "remote_f" } },
  });
  const u = await makeUnit(f, { gateProviderRefs: { opentech: { unitId: "remote_u" } } });
  const t = await makeTenant({ company: c._id });
  const rental = await Rental.create({
    company: c._id, facility: f._id, unit: u._id, tenant: t._id,
    amount: 100, status: "paid", signingStatus: "voided",
    gateProviderRefs: { opentech: { visitorId: "v_existing", accessCode: "12345678", provisionedAt: new Date() } },
    ...rentalOverrides,
  });
  return { rental, facility: f, unit: u };
}

describe("gateService.revokeTenant", () => {
  it("calls adapter and clears visitorId, writes Event", async () => {
    const { rental } = await seed();
    revokeTenantMock.mockResolvedValue();

    const result = await revokeTenant({ rentalId: rental._id });

    expect(result.noop).toBe(false);
    expect(revokeTenantMock).toHaveBeenCalledTimes(1);
    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.gateProviderRefs.opentech.visitorId).toBeFalsy();
    expect(await Event.countDocuments({ eventName: "Gate Revoked" })).toBe(1);
  });

  it("no-op when visitorId is unset", async () => {
    const { rental } = await seed({ gateProviderRefs: {} });
    const result = await revokeTenant({ rentalId: rental._id });
    expect(result).toEqual({ noop: true, reason: "no-visitor" });
    expect(revokeTenantMock).not.toHaveBeenCalled();
  });
});
