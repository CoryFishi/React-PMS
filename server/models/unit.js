const mongoose = require("mongoose");
const { Schema } = mongoose;

const storageUnitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
    unit: {
      type: String,
      enum: ["ft", "m"], // feet or meters
      default: "ft",
    },
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageFacility",
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
  },
  climateControlled: {
    type: Boolean,
    default: false,
  },
  securityLevel: {
    type: String,
    enum: ["Basic", "Enhanced", "High"],
    default: "Basic",
  },
  availability: {
    type: Boolean,
    default: true,
  },
  condition: {
    type: String,
    enum: ["new", "good", "fair", "poor"],
    default: "good",
  },
  paymentInfo: {
    moveInDate: {
      type: Date,
    },
    moveOutDate: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },
    pricePerMonth: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
  },
  status: {
    type: String,
    default: "Rented",
    required: [true, "Status is required"],
    enum: ["Rented", "Delinquent", "In Progress", "New"],
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

const StorageUnit = mongoose.model("StorageUnit", storageUnitSchema);

module.exports = StorageUnit;
