import Stripe from "stripe";

let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key =
      process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "sk_test_dummy";
    _stripe = new Stripe(key);
  }
  return _stripe;
}

const verifyStripeSignature = (req, res, next) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripeWebhookAuth] STRIPE_WEBHOOK_SECRET is not set; rejecting webhook");
    return res.status(503).json({ error: "Webhook auth not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ error: "Missing signature" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

  try {
    req.stripeEvent = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripeWebhookAuth] signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  return next();
};

export default verifyStripeSignature;
