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
    street1: {
      type: String,
      required: [true, "Street address is required"],
    },
    street2: {
      type: String,
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
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
  facilities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageFacility",
    },
  ],
  status: {
    type: String,
    enum: ["Disabled", "Enabled"],
    default: "Enabled",
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
