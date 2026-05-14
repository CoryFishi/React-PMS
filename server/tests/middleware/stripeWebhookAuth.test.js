import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Stripe from "stripe";
import verifyStripeSignature from "../../middleware/stripeWebhookAuth.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

function signPayload(payload, secret) {
  const stripe = Stripe("sk_test_dummy");
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

describe("stripeWebhookAuth middleware", () => {
  const SECRET = "whsec_test";
  let originalSecret;

  beforeEach(() => {
    originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("attaches req.stripeEvent and calls next() when signature is valid", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_1" } } });
    const buf = Buffer.from(payload);
    const req = { body: buf, headers: { "stripe-signature": signPayload(payload, SECRET) } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(req.stripeEvent).toBeTruthy();
    expect(req.stripeEvent.type).toBe("checkout.session.completed");
    expect(req.stripeEvent.data.object.id).toBe("cs_1");
  });

  it("returns 400 on invalid signature", () => {
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: { "stripe-signature": "t=1,v1=bogus" } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when signature header is missing", () => {
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: {} };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is unset", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const buf = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const req = { body: buf, headers: { "stripe-signature": "anything" } };
    const res = mockRes();
    let nextCalled = false;

    verifyStripeSignature(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(503);
  });
});
