import * as paymentService from "../services/paymentService.js";

export const handleStripeWebhook = async (req, res) => {
  try {
    const event = req.stripeEvent;
    if (!event) {
      return res.status(400).json({ error: "Missing event" });
    }

    if (event.type === "checkout.session.completed") {
      const sess = event.data?.object || {};
      const result = await paymentService.handleCheckoutCompleted({
        sessionId: sess.id,
        paymentIntentId: sess.payment_intent || undefined,
      });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(200).json({ ok: true, ignored: event.type });
  } catch (err) {
    console.error("[stripeWebhook] handler failed:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
