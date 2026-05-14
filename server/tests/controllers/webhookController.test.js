import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { applyEnvelopeEvent } from "../../services/leaseService.js";
import { docusignEnvelopeEvent } from "../../controllers/webhookController.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  applyEnvelopeEvent.mockReset();
});

describe("webhookController.docusignEnvelopeEvent", () => {
  it("returns 200 and calls applyEnvelopeEvent with extracted fields (data.* shape)", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: false, signingStatus: "signed" });
    const req = { body: { data: { envelopeId: "env_x", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledWith({ envelopeId: "env_x", status: "completed" });
  });

  it("falls back to top-level envelopeId/status fields", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: true, reason: "unmapped-status" });
    const req = { body: { envelopeId: "env_top", status: "sent" } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledWith({ envelopeId: "env_top", status: "sent" });
  });

  it("returns 200 for rental-not-found (idempotent / late delivery)", async () => {
    applyEnvelopeEvent.mockResolvedValue({ noop: true, reason: "rental-not-found" });
    const req = { body: { data: { envelopeId: "env_missing", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 500 when applyEnvelopeEvent throws (DocuSign will retry)", async () => {
    applyEnvelopeEvent.mockRejectedValue(new Error("db down"));
    const req = { body: { data: { envelopeId: "env_y", envelopeSummary: { status: "completed" } } } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(500);
  });

  it("returns 200 when envelopeId is missing (cannot route the event)", async () => {
    const req = { body: { data: {} } };
    const res = mockRes();

    await docusignEnvelopeEvent(req, res);

    expect(res.statusCode).toBe(200);
    expect(applyEnvelopeEvent).not.toHaveBeenCalled();
  });
});
