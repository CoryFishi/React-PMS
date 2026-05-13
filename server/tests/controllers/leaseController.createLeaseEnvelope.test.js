import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));

import { createEnvelope } from "../../services/leaseService.js";

let app;
beforeEach(async () => {
  createEnvelope.mockReset();
  app = buildApp();
});

async function seedRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company);
  const unit = await makeUnit(facility);
  const tenant = await makeTenant({ company: company._id });
  return Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 100,
    status: "paid",
    signingStatus: "unsent",
    ...overrides,
  });
}

describe("POST /rental/:rentalId/lease/envelope", () => {
  it("returns 200 with signingUrl and envelopeId on happy path", async () => {
    const rental = await seedRental();
    createEnvelope.mockResolvedValue({
      envelopeId: "env_happy",
      signingUrl: "https://docusign.example/sign/happy",
    });

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();

    expect(res.status).toBe(200);
    expect(res.body.envelopeId).toBe("env_happy");
    expect(res.body.signingUrl).toBe("https://docusign.example/sign/happy");
    expect(createEnvelope).toHaveBeenCalledWith({ rentalId: rental._id.toString() });
  });

  it("returns 409 when Rental.status is not paid", async () => {
    const rental = await seedRental({ status: "pending" });
    createEnvelope.mockRejectedValue(new Error("Payment not complete"));

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();
    expect(res.status).toBe(409);
  });

  it("returns 404 when Rental does not exist", async () => {
    createEnvelope.mockRejectedValue(new Error("Rental not found"));

    const res = await api(app)
      .post(`/rental/507f1f77bcf86cd799439011/lease/envelope`)
      .send();
    expect(res.status).toBe(404);
  });

  it("returns 502 when DocuSign returns an unexpected error", async () => {
    const rental = await seedRental();
    createEnvelope.mockRejectedValue(new Error("DocuSign 500 boom"));

    const res = await api(app).post(`/rental/${rental._id}/lease/envelope`).send();
    expect(res.status).toBe(502);
  });
});
