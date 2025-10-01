import mongoose from "mongoose";

const { Schema } = mongoose;

// Role Schema with Permissions
const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: [true, "Role name is already taken"],
      trim: true,
    },
    level: {
      type: String,
      enum: ["Customer", "Admin"],
      required: [true, "Role level is required"],
    },
    permissions: [
      {
        type: String,
        enum: [
          "edit_users",
          "create_users",
          "delete_users",
          "edit_companies",
          "create_companies",
          "delete_companies",
          "edit_facilities",
          "create_facilities",
          "delete_facilities",
        ],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const RoleModel = mongoose.model("Role", roleSchema);

export default RoleModel;
