import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";

const router = express.Router();

// NOTE: These routes are intentionally public (API key only, no JWT) because they
// serve the anonymous rental-center flow where a brand-new tenant has no JWT yet.
// They identify the actor via tenant ID embedded in the request body and the
// pre-existing Stripe customer link. Do NOT add JWT here without redesigning the
// rental signup flow.
router.post("/create", authenticateAPIKey, paymentController.createPayment);

router.post(
  "/unit-checkout-session",
  authenticateAPIKey,
  paymentController.createUnitCheckoutSession
);

export default router;
