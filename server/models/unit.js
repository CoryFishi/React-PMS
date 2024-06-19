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
    default: "basic",
  },
  pricePerMonth: {
    type: Number,
    required: true,
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
  photos: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

const StorageUnit = mongoose.model("StorageUnit", storageUnitSchema);

module.exports = StorageUnit;
