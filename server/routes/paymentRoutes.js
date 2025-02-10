const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Payments Route
router.post("/create", authenticateAPIKey, paymentController.createPayment);

module.exports = router;
