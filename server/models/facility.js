const mongoose = require("mongoose");

const storageFacilitySchema = new mongoose.Schema({
  facilityName: {
    type: String,
    required: [true, "Facility name is required"],
    trim: true,
    unique: [true, "Facility name is taken"],
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
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: [true, "Company reference is required"],
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
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
  securityLevel: {
    type: String,
    enum: ["Basic", "Enhanced", "High"],
    default: "Basic",
  },
  amenities: [
    {
      type: String,
      trim: true,
    },
  ],
  units: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageUnit",
    },
  ],
  status: {
    type: String,
    enum: ["Pending Deployment", "Disabled", "Enabled", "Maintenance"],
    default: "Pending Deployment",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  photos: [String],
});

const StorageFacility = mongoose.model(
  "StorageFacility",
  storageFacilitySchema
);

module.exports = StorageFacility;
