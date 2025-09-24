// Schemas
import Stripe from "stripe";
const stripe = Stripe(process.env.STRIPE_SECRET);
import Payment from "../models/payment.js";

// Endpoint to handle payments
export const createPayment = async (req, res) => {
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
