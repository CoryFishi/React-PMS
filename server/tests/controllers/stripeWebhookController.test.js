import { describe, it, expect, beforeEach, vi } from "vitest";

const handleCheckoutCompletedMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/paymentService.js", () => ({
  handleCheckoutCompleted: handleCheckoutCompletedMock,
}));

import { handleStripeWebhook } from "../../controllers/stripeWebhookController.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  handleCheckoutCompletedMock.mockReset();
});

describe("stripeWebhookController.handleStripeWebhook", () => {
  it("dispatches checkout.session.completed to paymentService with sessionId + paymentIntentId", async () => {
    handleCheckoutCompletedMock.mockResolvedValue({ noop: false });
    const req = {
      stripeEvent: {
        type: "checkout.session.completed",
        data: { object: { id: "cs_evt", payment_intent: "pi_evt" } },
      },
    };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(handleCheckoutCompletedMock).toHaveBeenCalledWith({
      sessionId: "cs_evt",
      paymentIntentId: "pi_evt",
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 200 ignored for unhandled event types without calling the service", async () => {
    const req = { stripeEvent: { type: "customer.created", data: { object: {} } } };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ignored).toBe("customer.created");
    expect(handleCheckoutCompletedMock).not.toHaveBeenCalled();
  });

  it("returns 500 when the service throws (Stripe will retry)", async () => {
    handleCheckoutCompletedMock.mockRejectedValue(new Error("db down"));
    const req = {
      stripeEvent: { type: "checkout.session.completed", data: { object: { id: "cs_x", payment_intent: "pi_x" } } },
    };
    const res = mockRes();

    await handleStripeWebhook(req, res);

    expect(res.statusCode).toBe(500);
  });
});
