import express from "express";
import verifyDocusignHmac from "../middleware/docusignHmac.js";
import * as webhookController from "../controllers/webhookController.js";
import verifyStripeSignature from "../middleware/stripeWebhookAuth.js";
import * as stripeWebhookController from "../controllers/stripeWebhookController.js";

const router = express.Router();

router.post(
  "/docusign",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyDocusignHmac,
  webhookController.docusignEnvelopeEvent
);

router.post(
  "/stripe",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyStripeSignature,
  stripeWebhookController.handleStripeWebhook
);

export default router;
