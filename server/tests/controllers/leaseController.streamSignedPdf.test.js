import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { streamSignedPdf } from "../../services/leaseService.js";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

let app;
beforeEach(async () => {
  streamSignedPdf.mockReset();
  app = buildApp();
});

async function seed() {
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
    signingStatus: "signed",
    envelopeId: "env_x",
  });
}

describe("GET /rental/:rentalId/lease/pdf", () => {
  it("200 with PDF body on happy path", async () => {
    const rental = await seed();
    streamSignedPdf.mockImplementation(async ({ res }) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="lease-${rental._id}.pdf"`);
      res.end(Buffer.from("%PDF-1.4 mocked"));
    });

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/pdf/);
  });

  it("404 when Rental not found", async () => {
    streamSignedPdf.mockRejectedValue(new Error("Rental not found"));

    const res = await api(app).get(`/rental/507f1f77bcf86cd799439011/lease/pdf`);
    expect(res.status).toBe(404);
  });

  it("409 when Lease not signed", async () => {
    streamSignedPdf.mockRejectedValue(new Error("Lease not signed"));
    const rental = await seed();

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);
    expect(res.status).toBe(409);
  });

  it("502 on other DocuSign errors", async () => {
    streamSignedPdf.mockRejectedValue(new Error("DocuSign 500 boom"));
    const rental = await seed();

    const res = await api(app).get(`/rental/${rental._id}/lease/pdf`);
    expect(res.status).toBe(502);
  });
});
