const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    contactInfo: {
      phone: {
        type: String,
        trim: true,
        match: [
          /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/,
          "Please fill a valid phone number",
        ],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please fill a valid email address",
        ],
      },
    },
    address: {
      street1: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      street2: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        match: [/^\d{5}(-\d{4})?$/, "Please fill a valid zip code"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
      },
    },
    units: [
      {
        type: Schema.Types.ObjectId,
        ref: "StorageUnit",
      },
    ],
    accessCode: {
      type: Number,
      min: [1000, "Access code must be at least 4 digits"],
      max: [99999999, "Access code must be at most 8 digits"],
    },
    paymentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: [true, "Payment amount is required"],
          min: [0, "Payment amount cannot be negative"],
        },
        method: {
          type: String,
          enum: ["credit card", "debit card", "cash", "check"],
          required: [true, "Payment method is required"],
        },
      },
    ],
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    status: {
      type: String,
      default: "Rented",
      required: [true, "Status is required"],
      enum: ["Rented", "Delinquent", "In Progress", "New"],
    },
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
