import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";
import Stripe from "stripe";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
  applyEnvelopeEvent: vi.fn(),
  streamSignedPdf: vi.fn(),
}));

vi.mock("../../services/paymentService.js", () => ({
  handleCheckoutCompleted: vi.fn().mockResolvedValue({ noop: false }),
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

describe("POST /webhooks/stripe — end-to-end", () => {
  function makeStripeSig(payload, secret) {
    const stripe = Stripe("sk_test_dummy");
    return stripe.webhooks.generateTestHeaderString({ payload, secret });
  }

  let stripeApp;
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    stripeApp = buildApp();
  });

  it("200 + signature accepted on checkout.session.completed", async () => {
    const payload = JSON.stringify({
      id: "evt_e2e",
      type: "checkout.session.completed",
      data: { object: { id: "cs_e2e", payment_intent: "pi_e2e" } },
    });

    const res = await api(stripeApp)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", makeStripeSig(payload, "whsec_test"))
      .send(payload);

    expect(res.status).toBe(200);
  });

  it("400 when signature is wrong", async () => {
    const payload = JSON.stringify({ id: "evt_bad", type: "checkout.session.completed", data: { object: {} } });

    const res = await api(stripeApp)
      .post("/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", "t=1,v1=bogus")
      .send(payload);

    expect(res.status).toBe(400);
  });
});
