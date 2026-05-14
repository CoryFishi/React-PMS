import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";
import StorageUnit from "../../models/unit.js";

const suspendUnitMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(), setDefaults: vi.fn(), getStatus: vi.fn(),
  provisionTenant: vi.fn(), revokeTenant: vi.fn(),
  suspendUnit: suspendUnitMock,
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: vi.fn(),
}));

import { updateTenantStatus } from "../../processes/delinquency.js";

const TEN_DAYS_AGO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  suspendUnitMock.mockReset();
  suspendUnitMock.mockResolvedValue({ noop: false });
});

describe("delinquency.updateTenantStatus — gate suspension hook", () => {
  it("calls gateService.suspendUnit for each overdue unit; one tenant flagged delinquent", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    await StorageUnit.collection.updateOne(
      { _id: u._id },
      { $set: { paymentDate: TEN_DAYS_AGO } }
    );

    const t = await makeTenant({ company: c._id });
    await Tenant.collection.updateOne({ _id: t._id }, { $set: { status: "Rented", units: [u._id] } });

    await updateTenantStatus({ disconnect: false });

    expect(suspendUnitMock).toHaveBeenCalledTimes(1);
    expect(suspendUnitMock).toHaveBeenCalledWith({ unitId: u._id });
  });

  it("per-tenant gate failures do not abort the batch", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const u1 = await makeUnit(f);
    const u2 = await makeUnit(f);
    await StorageUnit.collection.updateOne({ _id: u1._id }, { $set: { paymentDate: TEN_DAYS_AGO } });
    await StorageUnit.collection.updateOne({ _id: u2._id }, { $set: { paymentDate: TEN_DAYS_AGO } });

    const t1 = await makeTenant({ company: c._id });
    const t2 = await makeTenant({ company: c._id });
    await Tenant.collection.updateOne({ _id: t1._id }, { $set: { status: "Rented", units: [u1._id] } });
    await Tenant.collection.updateOne({ _id: t2._id }, { $set: { status: "Rented", units: [u2._id] } });

    suspendUnitMock
      .mockRejectedValueOnce(new Error("OpenTech down"))
      .mockResolvedValueOnce({ noop: false });

    await updateTenantStatus({ disconnect: false });

    expect(suspendUnitMock).toHaveBeenCalledTimes(2);
  });
});
