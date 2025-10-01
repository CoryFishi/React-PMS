import mongoose from "mongoose";

const { Schema } = mongoose;

const storageFacilitySchema = new Schema({
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
  tags: [{ type: String }],
  units: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StorageUnit",
    },
  ],
  settings: {
    amenities: [
      {
        name: {
          type: String,
          trim: true,
        },
        priority: {
          type: Boolean,
          default: false,
        },
      },
    ],
    unitTypes: [
      {
        name: { type: String },
        size: {
          width: { type: Number, required: true },
          height: { type: Number, required: true },
          depth: { type: Number, required: true },
          unit: {
            type: String,
            enum: ["ft", "m"],
            default: "ft",
          },
        },
        paymentInfo: {
          pricePerMonth: {
            type: Number,
            required: true,
          },
        },
        climateControlled: {
          type: Boolean,
          default: false,
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
        tags: [{ type: String, trim: true }],
      },
    ],
  },
  status: {
    type: String,
    enum: ["Pending Deployment", "Disabled", "Enabled", "Maintenance"],
    default: "Pending Deployment",
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

export default StorageFacility;
