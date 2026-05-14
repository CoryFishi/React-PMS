import { describe, it, expect, beforeEach } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";
import Rental from "../../models/rental.js";
import { runOrphanCleanup } from "../../processes/orphanCleanup.js";

const TEN_DAYS_AGO = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  process.env.ORPHAN_TENANT_AGE_DAYS = "7";
});

describe("orphanCleanup.runOrphanCleanup", () => {
  it("keeps New tenant with paid Rental", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.collection.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });
    await Rental.create({
      company: company._id, facility: facility._id, unit: unit._id,
      tenant: tenant._id, amount: 100, status: "paid",
    });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });

  it("deletes New tenant with no Rental, older than threshold", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.collection.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).toBeNull();
  });

  it("deletes New tenant + pending Rental older than threshold", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.collection.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });
    const rental = await Rental.create({
      company: company._id, facility: facility._id, unit: unit._id,
      tenant: tenant._id, amount: 100, status: "pending",
    });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).toBeNull();
    expect(await Rental.findById(rental._id)).toBeNull();
  });

  it("keeps New tenant within grace window (3 days old)", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "New" });
    await Tenant.collection.updateOne({ _id: tenant._id }, { $set: { createdAt: THREE_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });

  it("keeps Active tenant regardless of age", async () => {
    const company = await makeCompany();
    const tenant = await makeTenant({ company: company._id, status: "Active" });
    await Tenant.collection.updateOne({ _id: tenant._id }, { $set: { createdAt: TEN_DAYS_AGO } });

    await runOrphanCleanup({ disconnect: false });

    expect(await Tenant.findById(tenant._id)).not.toBeNull();
  });
});
