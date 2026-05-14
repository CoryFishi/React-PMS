import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const getDocument = vi.fn();
vi.mock("../../services/docusignClient.js", () => ({
  default: async () => ({
    envelopesApi: { getDocument },
    accountId: "acct_test",
  }),
}));

import { streamSignedPdf } from "../../services/leaseService.js";

function mockRes() {
  return {
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(buf) { this.body = buf; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.jsonBody = body; return this; },
  };
}

beforeEach(() => {
  getDocument.mockReset();
});

async function seed(overrides = {}) {
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
    envelopeId: "env_signed",
    signedAt: new Date(),
    ...overrides,
  });
}

describe("leaseService.streamSignedPdf", () => {
  it("happy path: writes PDF headers and ends with buffer", async () => {
    const rental = await seed();
    const pdfBuf = Buffer.from("%PDF-1.4 fake");
    getDocument.mockResolvedValue(pdfBuf);

    const res = mockRes();
    await streamSignedPdf({ rentalId: rental._id, res });

    expect(getDocument).toHaveBeenCalledWith("acct_test", "env_signed", "combined");
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toMatch(/lease-/);
    expect(res.body).toBe(pdfBuf);
  });

  it("throws 'Lease not signed' when signingStatus is not 'signed'", async () => {
    const rental = await seed({ signingStatus: "sent" });
    const res = mockRes();
    await expect(streamSignedPdf({ rentalId: rental._id, res })).rejects.toThrow(/lease not signed/i);
    expect(getDocument).not.toHaveBeenCalled();
  });

  it("throws 'Rental not found' for unknown id", async () => {
    const res = mockRes();
    await expect(
      streamSignedPdf({ rentalId: "507f1f77bcf86cd799439011", res })
    ).rejects.toThrow(/rental not found/i);
  });
});
