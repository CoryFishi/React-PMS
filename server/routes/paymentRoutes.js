import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";

const router = express.Router();

// Payments Route
router.post("/create", authenticateAPIKey, paymentController.createPayment);

router.post(
  "/unit-checkout-session",
  authenticateAPIKey,
  paymentController.createUnitCheckoutSession
);

export default router;
