const mongoose = require("mongoose");

const storageUnitSchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: true,
    trim: true,
  },
  unitType: {
    type: String,
    required: true,
    trim: true,
  },
  accessCode: {
    type: Number,
    trim: true,
    default: 0,
  },
  location: {
    type: String,
  },
  directions: {
    type: String,
  },
  specifications: {
    width: { type: Number, required: true },
    depth: { type: Number, required: true },
    height: { type: Number },
    doorSize: { type: String },
    doorType: { type: String },
    accessType: { type: String },
    climateControlled: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: String,
      enum: ["ft", "m"],
      default: "ft",
    },
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageFacility",
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
  },
  availability: {
    type: Boolean,
    default: true,
  },
  condition: {
    type: String,
    enum: ["New", "Good", "Fair", "Poor"],
    default: "Good",
  },
  notes: [
    {
      message: { type: String, required: true },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      requiredResponse: {
        type: Boolean,
        default: false,
      },
      responseDate: {
        type: Date,
        required: function () {
          return this.requiredResponse === true;
        },
      },
    },
  ],
  paymentInfo: {
    pricePerMonth: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    prepaidCredit: {
      type: Number,
      default: 0,
    },
  },
  lastMoveInDate: {
    type: Date,
  },
  lastMoveOutDate: {
    type: Date,
    default: Date.now,
  },
  tags: [{ type: String, trim: true }],
  amenities: [{ type: String, trim: true }],
  status: {
    type: String,
    default: "Vacant",
    required: [true, "Status is required"],
    enum: ["Rented", "Delinquent", "Vacant"],
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
