import Payment from "../models/payment.js";
import StorageUnit from "../models/unit.js";
import mongoose from "mongoose";
import {
  getStripeClient,
  assertStripeReadyForCompany,
} from "../services/stripeConnect.js";
import * as leaseService from "../services/leaseService.js";

// Endpoint to handle payments
export const createPayment = async (req, res) => {
  const { tenantId, unitId, amount } = req.body;
  try {
    const unit = await StorageUnit.findById(unitId);
    if (!unit) {
      return res.status(404).send("Unit not found");
    }

    const chargeAmount =
      typeof amount === "number" ? amount : unit.paymentInfo?.pricePerMonth;

    if (typeof chargeAmount !== "number" || Number.isNaN(chargeAmount)) {
      return res.status(400).send("A valid amount is required");
    }

    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(chargeAmount * 100),
      currency: unit.stripe?.currency || "usd",
      payment_method_types: ["card"],
      metadata: {
        tenantId: tenantId?.toString() || "",
        unitId: unitId?.toString() || "",
        facilityId: unit.facility?.toString() || "",
      },
    });
    // Save payment details to the database
    const payment = new Payment({
      tenantId,
      unitId,
      amount: chargeAmount,
      paymentIntentId: paymentIntent.id,
      stripeAccountId: unit.stripe?.accountId,
      stripeProductId: unit.stripe?.productId,
      stripePriceId: unit.stripe?.priceId,
    });
    await payment.save();

    res.status(201).send(paymentIntent.client_secret);
  } catch (error) {
    if (error?.message === "Stripe secret key is not configured") {
      return res.status(500).send(error.message);
    }
    res.status(400).send(error.message);
  }
};

export const createUnitCheckoutSession = async (req, res) => {
  try {
    const { unitId, tenantEmail, tenantName, successUrl, cancelUrl } = req.body;

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    const unit = await StorageUnit.findById(unitId).populate("facility");
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    if (!unit.availability || unit.status === "Rented") {
      return res.status(409).json({ message: "Unit is not currently available" });
    }
    if (!unit.facility) {
      return res.status(409).json({ message: "Unit is missing facility association" });
    }

    let company;
    try {
      company = await assertStripeReadyForCompany(unit.facility.company);
    } catch (e) {
      if (e.message === "Company not found") return res.status(404).json({ message: e.message });
      if (
        e.message === "Company is not connected to Stripe" ||
        e.message === "Company has not completed Stripe onboarding"
      ) {
        return res.status(409).json({ message: e.message });
      }
      throw e;
    }

    const resolvedSuccess = successUrl || req.body.url;
    const resolvedCancel = cancelUrl || req.body.url;
    if (!resolvedSuccess || !resolvedCancel) {
      return res.status(400).json({ message: "Both successUrl and cancelUrl are required" });
    }

    const tenantShim = {
      _id: req.body.tenantId
        ? new mongoose.Types.ObjectId(req.body.tenantId)
        : new mongoose.Types.ObjectId(),
      firstName: tenantName || "",
      lastName: "",
      contactInfo: { email: tenantEmail || undefined },
    };

    let result;
    try {
      result = await leaseService.startRental({
        company,
        facility: unit.facility,
        unit,
        tenant: tenantShim,
        successUrl: resolvedSuccess,
        cancelUrl: resolvedCancel,
      });
    } catch (svcErr) {
      if (svcErr.message === "Unit is not configured with a Stripe price") {
        return res.status(409).json({ message: svcErr.message });
      }
      if (svcErr.message === "Unit's Stripe price is inactive") {
        return res.status(409).json({ message: svcErr.message });
      }
      throw svcErr;
    }

    const Rental = (await import("../models/rental.js")).default;
    const rental = await Rental.findById(result.rentalId);
    return res.status(200).json({
      id: rental.checkoutSessionId,
      url: result.checkoutUrl,
      amount: rental.amount,
      currency: rental.currency,
      mode: rental.checkoutMode || "payment",
    });
  } catch (error) {
    console.error("Error creating tenant checkout session:", error);
    if (error?.message === "Stripe secret key is not configured") {
      return res.status(500).json({ message: error.message });
    }
    if (error?.type === "StripeInvalidRequestError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to create checkout session" });
  }
};
