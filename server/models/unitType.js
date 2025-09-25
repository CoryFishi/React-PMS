const unitTypeSchema = new mongoose.Schema({
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
  amenities: [{ type: String, trim: true }],
  stripePriceId: {
    type: String,
    default: null,
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageFacility",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const UnitType = mongoose.model("UnitType", unitTypeSchema);
