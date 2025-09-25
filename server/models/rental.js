const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageFacility",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageUnit",
      required: true,
    },
    tenantEmail: {
      type: String,
      trim: true,
    },
    tenantName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    checkoutSessionId: {
      type: String,
      index: true,
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    stripeAccountId: {
      type: String,
      index: true,
    },
    stripePriceId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "canceled"],
      default: "pending",
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

rentalSchema.index({ company: 1, facility: 1, unit: 1, checkoutSessionId: 1 });

const Rental = mongoose.model("Rental", rentalSchema);

module.exports = Rental;
