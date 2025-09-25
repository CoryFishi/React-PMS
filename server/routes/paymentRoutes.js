const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Payments Route
router.post("/create", authenticateAPIKey, paymentController.createPayment);
router.post(
  "/unit-checkout-session",
  authenticateAPIKey,
  paymentController.createUnitCheckoutSession
);

module.exports = router;
