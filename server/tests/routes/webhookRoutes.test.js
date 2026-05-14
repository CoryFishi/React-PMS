import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

import { applyEnvelopeEvent } from "../../services/leaseService.js";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

function sign(rawBody, key) {
  return crypto.createHmac("sha256", key).update(rawBody).digest("base64");
}

let app;
beforeEach(() => {
  applyEnvelopeEvent.mockReset();
  applyEnvelopeEvent.mockResolvedValue({ noop: false, signingStatus: "signed" });
  process.env.DS_CONNECT_HMAC_KEY = "test-hmac-key";
  app = buildApp();
});

describe("POST /webhooks/docusign", () => {
  it("200 + calls applyEnvelopeEvent when HMAC matches", async () => {
    const payload = JSON.stringify({
      data: { envelopeId: "env_route", envelopeSummary: { status: "completed" } },
    });

    const res = await api(app)
      .post("/webhooks/docusign")
      .set("Content-Type", "application/json")
      .set("X-DocuSign-Signature-1", sign(payload, "test-hmac-key"))
      .send(payload);

    expect(res.status).toBe(200);
    expect(applyEnvelopeEvent).toHaveBeenCalledTimes(1);
  });

  it("401 when HMAC is wrong", async () => {
    const payload = JSON.stringify({
      data: { envelopeId: "env_route", envelopeSummary: { status: "completed" } },
    });

    const res = await api(app)
      .post("/webhooks/docusign")
      .set("Content-Type", "application/json")
      .set("X-DocuSign-Signature-1", "deadbeef")
      .send(payload);

    expect(res.status).toBe(401);
    expect(applyEnvelopeEvent).not.toHaveBeenCalled();
  });

  it("non-webhook JSON endpoints still parse JSON normally (mount order check)", async () => {
    const res = await api(app)
      .post("/companies/create")
      .send({ companyName: "X" });
    expect(res.status).toBeLessThan(500);
  });
});
