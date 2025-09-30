const mongoose = require("mongoose");
const { Schema } = mongoose;

const tenantSchema = new Schema(
  {
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
    vehicle: {
      DLNumber: {
        type: String,
        required: [true, "Driver's License Number Required"],
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
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      maxlength: [32, "Password must be at most 32 characters long"],
      validate: {
        validator: function (v) {
          return (
            /[a-z]/.test(v) &&
            /[A-Z]/.test(v) &&
            /[0-9]/.test(v) &&
            /[^A-Za-z0-9]/.test(v)
          );
        },
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol",
      },
      select: false,
    },
    dateOfBirth: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"],
      required: [true, "Date of birth is required"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    notes: [
      {
        message: { type: String, required: [true, "Message is required"] },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Created by user reference is required"],
        },
        createdAt: {
          type: Date,
          required: [true, "Created at date is required"],
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
    status: {
      type: String,
      default: "Active",
      required: [true, "Status is required"],
      enum: ["New", "Active", "Disabled"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
