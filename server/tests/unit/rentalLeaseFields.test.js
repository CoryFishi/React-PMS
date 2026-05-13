import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Rental from "../../models/rental.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

describe("Rental schema — lease fields", () => {
  it("accepts tenant, envelopeId, signingStatus, signedAt, signedPdfUrl", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const tenantId = new mongoose.Types.ObjectId();

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      tenant: tenantId,
      envelopeId: "env_abc",
      signingStatus: "sent",
      signedAt: new Date("2026-05-13"),
      signedPdfUrl: "https://example.test/lease.pdf",
    });

    expect(rental.tenant.toString()).toBe(tenantId.toString());
    expect(rental.envelopeId).toBe("env_abc");
    expect(rental.signingStatus).toBe("sent");
    expect(rental.signedAt).toEqual(new Date("2026-05-13"));
    expect(rental.signedPdfUrl).toBe("https://example.test/lease.pdf");
  });

  it("defaults signingStatus to 'unsent'", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const rental = await Rental.create({
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
    });

    expect(rental.signingStatus).toBe("unsent");
  });

  it("rejects an invalid signingStatus enum value", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    await expect(
      Rental.create({
        company: c._id,
        facility: f._id,
        unit: u._id,
        amount: 100,
        signingStatus: "bogus",
      })
    ).rejects.toThrow();
  });
});
