const express = require("express");
const router = express.Router();

const { createPayment } = require("../controllers/paymentController");

// Payments Route
router.post("/create", createPayment);

module.exports = router;
