import Payment from "../models/payment.js";
import StorageUnit from "../models/unit.js";
import Rental from "../models/rental.js";
import {
  getStripeClient,
  assertStripeReadyForCompany,
} from "../services/stripeConnect.js";

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
    const stripe = getStripeClient();
    const {
      unitId,
      tenantEmail,
      tenantName,
      successUrl,
      cancelUrl,
      metadata: metadataPayload,
    } = req.body;

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    const unit = await StorageUnit.findById(unitId).populate("facility");

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    if (!unit.availability || unit.status === "Rented") {
      return res
        .status(409)
        .json({ message: "Unit is not currently available" });
    }

    const facility = unit.facility;

    if (!facility) {
      return res
        .status(409)
        .json({ message: "Unit is missing facility association" });
    }

    let company;
    try {
      company = await assertStripeReadyForCompany(facility.company);
    } catch (validationError) {
      if (validationError.message === "Company not found") {
        return res.status(404).json({ message: validationError.message });
      }
      if (validationError.message === "Company is not connected to Stripe") {
        return res.status(409).json({ message: validationError.message });
      }
      if (
        validationError.message ===
        "Company has not completed Stripe onboarding"
      ) {
        return res.status(409).json({ message: validationError.message });
      }
      throw validationError;
    }

    const stripeAccountId = unit.stripe?.accountId || company.stripe?.accountId;

    const priceId = unit.stripe?.priceId;

    if (!priceId) {
      return res.status(409).json({
        message: "Unit is not configured with a Stripe price",
      });
    }

    let price;
    try {
      price = await stripe.prices.retrieve(priceId, {
        stripeAccount: stripeAccountId,
        expand: ["product"],
      });
    } catch (priceError) {
      console.error("Unable to retrieve Stripe price for unit:", priceError);
      if (priceError?.code === "resource_missing") {
        return res.status(409).json({
          message: "Configured Stripe price could not be found",
        });
      }
      throw priceError;
    }

    if (!price || price.active === false) {
      return res.status(409).json({
        message: "Unit's Stripe price is inactive",
      });
    }

    const isRecurringPrice = price.type === "recurring";
    const checkoutMode = isRecurringPrice ? "subscription" : "payment";

    const resolvedSuccessUrl = successUrl || req.body.url;
    const resolvedCancelUrl = cancelUrl || req.body.url;

    if (!resolvedSuccessUrl || !resolvedCancelUrl) {
      return res.status(400).json({
        message: "Both successUrl and cancelUrl are required",
      });
    }

    const metadata = {
      companyId: company._id.toString(),
      facilityId: facility._id.toString(),
      unitId: unit._id.toString(),
      ...(tenantName ? { tenantName } : {}),
      ...(metadataPayload && typeof metadataPayload === "object"
        ? Object.fromEntries(
            Object.entries(metadataPayload).filter(
              ([, value]) => value !== undefined && value !== null
            )
          )
        : {}),
    };

    const metadataForStripe = Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [
        key,
        value === undefined || value === null ? "" : String(value),
      ])
    );

    const sessionPayload = {
      mode: checkoutMode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: resolvedSuccessUrl,
      cancel_url: resolvedCancelUrl,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      customer_email: tenantEmail || undefined,
    };

    if (Object.keys(metadataForStripe).length > 0) {
      sessionPayload.metadata = metadataForStripe;
    }

    if (checkoutMode === "payment") {
      sessionPayload.payment_intent_data = { metadata: metadataForStripe };
    } else {
      sessionPayload.subscription_data = { metadata: metadataForStripe };
    }

    const session = await stripe.checkout.sessions.create(sessionPayload, {
      stripeAccount: stripeAccountId,
    });

    const priceAmountInCents =
      typeof price.unit_amount === "number"
        ? price.unit_amount
        : unit.stripe?.priceAmount;

    const priceAmount =
      typeof priceAmountInCents === "number"
        ? priceAmountInCents / 100
        : unit.paymentInfo?.pricePerMonth;

    if (typeof priceAmount !== "number" || Number.isNaN(priceAmount)) {
      return res
        .status(409)
        .json({ message: "Unit does not have a valid price configured" });
    }

    const rentalMetadata =
      Object.keys(metadataForStripe).length > 0 ? metadataForStripe : undefined;

    await Rental.create({
      company: company._id,
      facility: facility._id,
      unit: unit._id,
      tenantEmail: tenantEmail || undefined,
      tenantName: tenantName || undefined,
      amount: priceAmount,
      currency: price?.currency || unit.stripe?.currency || "usd",
      checkoutSessionId: session.id,
      stripeAccountId,
      stripePriceId: priceId,
      checkoutMode,
      stripePriceType: price?.type,
      stripeRecurringInterval: price?.recurring?.interval,
      stripeRecurringIntervalCount: price?.recurring?.interval_count,
      metadata: rentalMetadata,
    });

    res.status(200).json({
      id: session.id,
      url: session.url,
      amount: priceAmount,
      currency: price?.currency || unit.stripe?.currency || "usd",
      mode: checkoutMode,
    });
  } catch (error) {
    console.error("Error creating tenant checkout session:", error);
    if (error?.message === "Stripe secret key is not configured") {
      return res.status(500).json({ message: error.message });
    }
    if (error?.type === "StripeInvalidRequestError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};
