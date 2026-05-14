import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Event from "../../models/event.js";

const provisionTenantMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateProviders/openTechAdapter.js", () => ({
  default: {
    listTimeGroups: vi.fn(),
    listAccessProfiles: vi.fn(),
    provisionTenant: provisionTenantMock,
    revokeTenant: vi.fn(),
    suspendUnit: vi.fn(),
    unsuspendUnit: vi.fn(),
    healthCheck: vi.fn(),
  },
}));

import { provisionTenant } from "../../services/gateService.js";

beforeEach(() => provisionTenantMock.mockReset());

async function seedRental(opts = {}) {
  const company = await makeCompany({ gateProviders: { opentech: { apiKey: "k", apiSecret: "s" } } });
  const hasProvider = !("facilityProvider" in opts) || opts.facilityProvider != null;
  const facilityOverrides = {
    ...(hasProvider ? { gateProvider: opts.facilityProvider ?? "opentech" } : {}),
    gateProviderRefs: {
      opentech: {
        facilityId: "remote_f",
        timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
        accessProfiles: [{ id: "ap1", name: "All", isDefault: true }],
        defaultTimeGroupId: "tg1",
        defaultAccessProfileId: "ap1",
        syncedAt: new Date(),
      },
    },
  };
  const facility = await makeFacility(company, facilityOverrides);
  const unit = await makeUnit(facility, {
    gateProviderRefs: { opentech: { unitId: "remote_u" } },
  });
  const tenant = await makeTenant({ company: company._id });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 100,
    status: "paid",
    signingStatus: "signed",
    ...(opts.rental || {}),
  });
  return { rental, tenant, facility, unit, company };
}

describe("gateService.provisionTenant", () => {
  it("no-op when facility has no gate provider", async () => {
    const { rental } = await seedRental({ facilityProvider: undefined });
    const result = await provisionTenant({ rentalId: rental._id });
    expect(result.noop).toBe(true);
    expect(provisionTenantMock).not.toHaveBeenCalled();
  });

  it("happy path: calls adapter, persists visitorId/accessCode/provisionedAt, writes Event", async () => {
    const { rental } = await seedRental();
    provisionTenantMock.mockResolvedValue({ visitorId: "v_remote" });

    const result = await provisionTenant({ rentalId: rental._id });

    expect(result.noop).toBe(false);
    expect(result.visitorId).toBe("v_remote");
    expect(result.accessCode).toMatch(/^\d{8}$/);

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.gateProviderRefs.opentech.visitorId).toBe("v_remote");
    expect(refreshed.gateProviderRefs.opentech.accessCode).toMatch(/^\d{8}$/);
    expect(refreshed.gateProviderRefs.opentech.provisionedAt).toBeInstanceOf(Date);

    expect(await Event.countDocuments({ eventName: "Gate Provisioned" })).toBe(1);
  });

  it("idempotent: skips when visitorId already set", async () => {
    const { rental } = await seedRental({
      rental: {
        gateProviderRefs: { opentech: { visitorId: "existing", accessCode: "11111111", provisionedAt: new Date() } },
      },
    });
    const result = await provisionTenant({ rentalId: rental._id });
    expect(result).toEqual({ noop: true, reason: "already-provisioned" });
    expect(provisionTenantMock).not.toHaveBeenCalled();
  });

  it("retries once with a new code on 400 duplicate-access-code", async () => {
    const { rental } = await seedRental();
    provisionTenantMock
      .mockRejectedValueOnce(Object.assign(new Error("duplicate access code"), { status: 400, body: "duplicate" }))
      .mockResolvedValueOnce({ visitorId: "v_retry" });

    const result = await provisionTenant({ rentalId: rental._id });
    expect(result.visitorId).toBe("v_retry");
    expect(provisionTenantMock).toHaveBeenCalledTimes(2);
  });
});
