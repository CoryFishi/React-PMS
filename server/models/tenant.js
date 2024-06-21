const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
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
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
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
    },
    paymentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ["credit card", "debit card", "cash", "check"],
          required: true,
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
