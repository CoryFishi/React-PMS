const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET);
const Payment = require("../models/payment");
const Company = require("../models/company");
const Tenant = require("../models/company");
const StorageUnit = require("../models/unit");

// Endpoint to handle payments
const createPayment = async (req, res) => {
  const { tenantId, unitId, amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency: "usd",
      payment_method_types: ["card"],
    });
    // Save payment details to the database
    const payment = new Payment({
      tenantId,
      unitId,
      amount,
      paymentIntentId: paymentIntent.id,
    });
    await payment.save();

    res.status(201).send(paymentIntent.client_secret);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = {
  createPayment,
};
