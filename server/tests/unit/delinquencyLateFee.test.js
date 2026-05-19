// server/tests/unit/delinquencyLateFee.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateTenantStatus } from "../../processes/delinquency.js";
import Tenant from "../../models/tenant.js";
import {
  makeCompany, makeFacility, makeUnit, makeTenant, makeRental,
} from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  suspendUnit: vi.fn().mockResolvedValue(undefined),
}));
import * as gateService from "../../services/gateService.js";

beforeEach(() => vi.clearAllMocks());

async function seedOverdue({ billing }) {
  const c = await makeCompany();
  const f = await makeFacility(c, { settings: { billing } });
  const old = new Date();
  old.setDate(old.getDate() - 60);
  const u = await makeUnit(f, {
    status: "Rented",
    lastMoveInDate: old,
    paymentInfo: { pricePerMonth: 200 },
  });
  const t = await makeTenant({ company: c._id, status: "Rented", units: [u._id], balance: 0 });
  await makeRental(u, t, {
    company: c._id, facility: f._id, unit: u._id, amount: 200, status: "paid",
  });
  return { f, u, t };
}

describe("delinquency late fee + grace period", () => {
  it("marks delinquent and applies flat+percent fee once", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, lateFee: { flatAmount: 25, percentOfRent: 10 } },
    });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Delinquent");
    expect(reloaded.balance).toBe(45);
  });

  it("does not double-charge on a second run", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, lateFee: { flatAmount: 25, percentOfRent: 10 } },
    });
    await updateTenantStatus({ disconnect: false });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.balance).toBe(45);
  });

  it("honors a longer grace period (not yet overdue)", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: { billing: { gracePeriodDays: 90, lateFee: { flatAmount: 25, percentOfRent: 0 } } },
    });
    const d = new Date(); d.setDate(d.getDate() - 30);
    const u = await makeUnit(f, { status: "Rented", lastMoveInDate: d, paymentInfo: { pricePerMonth: 200 } });
    const t = await makeTenant({ company: c._id, status: "Rented", units: [u._id], balance: 0 });
    await makeRental(u, t, { company: c._id, facility: f._id, unit: u._id, amount: 200, status: "paid" });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Rented");
    expect(reloaded.balance).toBe(0);
  });

  it("skips gate suspend when autoSuspendOnDelinquency is false but still marks delinquent", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, autoSuspendOnDelinquency: false, lateFee: { flatAmount: 10, percentOfRent: 0 } },
    });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Delinquent");
    expect(gateService.suspendUnit).not.toHaveBeenCalled();
  });
});
