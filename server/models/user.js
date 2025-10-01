import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      unique: [true, "Display name is already taken"],
      trim: true,
      minlength: [3, "Display name must be at least 3 characters long"],
      maxlength: [20, "Display name must be at most 20 characters long"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [30, "Name must be at most 30 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email is already taken"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^\(?([0-9]{3})\)?[-.●]?([0-9]{3})[-.●]?([0-9]{4})$/,
        "Please fill a valid phone number",
      ],
    },
    password: {
      type: String,
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
    role: {
      type: String,
      enum: ["Company_User", "Company_Admin", "System_Admin", "System_User"],
      default: "Company_User",
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    facilities: [
      {
        type: Schema.Types.ObjectId,
        ref: "StorageFacility",
      },
    ],
    selectedFacility: {
      type: Schema.Types.ObjectId,
      ref: "StorageFacility",
      default: null,
    },
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
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
