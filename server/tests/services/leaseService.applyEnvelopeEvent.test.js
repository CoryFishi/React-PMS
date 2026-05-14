import { describe, it, expect, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";
import Tenant from "../../models/tenant.js";
import Event from "../../models/event.js";

import { applyEnvelopeEvent } from "../../services/leaseService.js";

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id, status: "New" });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "paid",
    signingStatus: "sent",
    envelopeId: "env_abc",
    ...overrides,
  });
  return { rental, tenant, company };
}

describe("leaseService.applyEnvelopeEvent", () => {
  it("returns noop when Rental does not exist for envelopeId", async () => {
    const result = await applyEnvelopeEvent({ envelopeId: "env_missing", status: "completed" });
    expect(result).toEqual({ noop: true, reason: "rental-not-found" });
  });

  it("on completed: sets signingStatus=signed, signedAt, Tenant.status=Active, writes Event", async () => {
    const { rental, tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result).toEqual({ noop: false, signingStatus: "signed" });

    const refreshedRental = await Rental.findById(rental._id);
    expect(refreshedRental.signingStatus).toBe("signed");
    expect(refreshedRental.signedAt).toBeInstanceOf(Date);

    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("Active");

    const events = await Event.find({ eventName: "Lease Signed", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("on declined: sets signingStatus=declined, leaves Tenant untouched, writes Event", async () => {
    const { rental, tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "declined" });

    expect(result).toEqual({ noop: false, signingStatus: "declined" });
    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("New");
    const refreshedRental = await Rental.findById(rental._id);
    expect(refreshedRental.signingStatus).toBe("declined");

    const events = await Event.find({ eventName: "Lease Declined", company: company._id });
    expect(events).toHaveLength(1);
  });

  it("on voided: sets signingStatus=voided, writes Event, Tenant unchanged", async () => {
    const { tenant, company } = await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "voided" });

    expect(result).toEqual({ noop: false, signingStatus: "voided" });
    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant.status).toBe("New");
    expect((await Event.find({ eventName: "Lease Voided", company: company._id }))).toHaveLength(1);
  });

  it("idempotent: re-applying same status returns already-applied noop", async () => {
    await seedRental({ signingStatus: "signed" });

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result).toEqual({ noop: true, reason: "already-applied" });
    expect(await Event.countDocuments({ eventName: "Lease Signed" })).toBe(0);
  });

  it("returns unmapped-status noop for non-terminal statuses (e.g. 'sent')", async () => {
    await seedRental();

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "sent" });

    expect(result).toEqual({ noop: true, reason: "unmapped-status" });
  });

  it("on completed: also calls gateService.provisionTenant", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "provisionTenant").mockResolvedValue({ noop: false, visitorId: "v" });

    await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(spy).toHaveBeenCalledWith({ rentalId: rental._id });
    spy.mockRestore();
  });

  it("on completed: gate provisioning failure does not block the envelope transition; persists gateProvisionError", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "provisionTenant").mockRejectedValue(new Error("OpenTech down"));

    const result = await applyEnvelopeEvent({ envelopeId: "env_abc", status: "completed" });

    expect(result.signingStatus).toBe("signed");
    const Rental = (await import("../../models/rental.js")).default;
    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.signingStatus).toBe("signed");
    expect(refreshed.gateProvisionError).toMatch(/OpenTech down/);
    spy.mockRestore();
  });

  it("on declined: calls gateService.revokeTenant", async () => {
    const { rental } = await seedRental();
    const gateService = await import("../../services/gateService.js");
    const spy = vi.spyOn(gateService, "revokeTenant").mockResolvedValue({ noop: false });

    await applyEnvelopeEvent({ envelopeId: "env_abc", status: "declined" });

    expect(spy).toHaveBeenCalledWith({ rentalId: rental._id });
    spy.mockRestore();
  });
});
