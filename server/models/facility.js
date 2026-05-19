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
    billing: {
      type: new mongoose.Schema(
        {
          gracePeriodDays: { type: Number, default: 7, min: 0 },
          lateFee: {
            flatAmount: { type: Number, default: 0, min: 0 },
            percentOfRent: { type: Number, default: 0, min: 0, max: 100 },
          },
          autoSuspendOnDelinquency: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    hours: {
      office: [
        {
          day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          open: { type: String },
          close: { type: String },
          closed: { type: Boolean, default: false },
        },
      ],
      gateAccess: [
        {
          day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          open: { type: String },
          close: { type: String },
          closed: { type: Boolean, default: false },
        },
      ],
    },
    contact: {
      publicPhone: { type: String, trim: true },
      publicEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
      },
      announcement: { type: String, trim: true, maxlength: 1000 },
    },
    general: {
      type: new mongoose.Schema(
        {
          timezone: { type: String, default: "America/Chicago" },
          currency: { type: String, default: "USD" },
          notificationEmailOverride: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
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
  gateProvider: {
    type: String,
    enum: ["opentech"],
  },
  gateProviderRefs: {
    opentech: {
      facilityId: { type: String },
      timeGroups: [{
        id: { type: String },
        name: { type: String },
        isDefault: { type: Boolean },
      }],
      accessProfiles: [{
        id: { type: String },
        name: { type: String },
        isDefault: { type: Boolean },
      }],
      defaultTimeGroupId: { type: String },
      defaultAccessProfileId: { type: String },
      syncedAt: { type: Date },
    },
  },
});

const StorageFacility = mongoose.model(
  "StorageFacility",
  storageFacilitySchema
);

export default StorageFacility;
