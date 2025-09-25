const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanySchema = new Schema({
  companyName: {
    type: String,
    required: [true, "Company Name is required"],
    trim: true,
    unique: [true, "Company Name is already taken"],
    minlength: [3, "Company name must be at least 3 characters long"],
  },
  address: {
    street1: { type: String, required: [true, "Street address is required"] },
    street2: { type: String },
    city: { type: String, required: [true, "City is required"] },
    state: { type: String, required: [true, "State is required"] },
    zipCode: { type: String, required: [true, "Zip code is required"] },
    country: { type: String, required: [true, "Country is required"] },
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
  logo: {
    type: String,
    trim: true,
    match: [/^(http|https):\/\/[^ "]+$/, "Please enter a valid URL"],
  },
  insurancePlans: [
    {
      name: {
        type: String,
        required: [true, "Plan name is required"],
        trim: true,
      },
      coverageAmount: {
        type: Number,
        required: [true, "Coverage amount is required"],
        min: [0, "Coverage amount must be at least 0"],
      },
      monthlyPrice: {
        type: Number,
        required: [true, "Monthly price is required"],
        min: [0, "Monthly price must be at least 0"],
      },
      active: {
        type: Boolean,
        default: true,
      },
    },
  ],

  status: {
    type: String,
    enum: ["Disabled", "Enabled"],
    default: "Enabled",
  },
  stripe: {
    accountId: { type: String },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    requirements: {
      currentlyDue: { type: [String], default: () => [] },
      eventuallyDue: { type: [String], default: () => [] },
      pastDue: { type: [String], default: () => [] },
      pendingVerification: { type: [String], default: () => [] },
      currentDeadline: { type: Date },
      disabledReason: { type: String },
    },
    futureRequirements: {
      currentlyDue: { type: [String], default: () => [] },
      eventuallyDue: { type: [String], default: () => [] },
      pastDue: { type: [String], default: () => [] },
      pendingVerification: { type: [String], default: () => [] },
      currentDeadline: { type: Date },
    },
    lastRequirementsSync: { type: Date },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator reference is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
