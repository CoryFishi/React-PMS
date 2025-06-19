const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"],
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
      alternatePhone: {
        type: String,
        trim: true,
        match: [
          /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/,
          "Please fill a valid alternate phone number",
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
    vehicle: {
      DLNumber: {
        type: String,
        required: [true, "Last Four of Driver's License Number Required"],
        trim: true,
      },
      DLExpire: {
        type: Date,
        required: [true, "Driver's License Expiration Required"],
        trim: true,
      },
      DLState: {
        type: String,
        required: [true, "Driver's License State Required"],
        trim: true,
      },
      vehiclePlate: {
        type: String,
        trim: true,
      },
      vehicleState: {
        type: String,
        trim: true,
      },
      vehicleMake: {
        type: String,
        trim: true,
      },
      vehicleModel: {
        type: String,
        trim: true,
      },
      vehicleVin: {
        type: String,
        trim: true,
      },
      vehicleDesc: {
        type: String,
        trim: true,
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
    affiliatedFacilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
    status: {
      type: String,
      default: "Active",
      required: [true, "Status is required"],
      enum: ["New", "Active", "Disabled"],
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
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
