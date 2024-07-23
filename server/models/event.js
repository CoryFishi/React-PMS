const mongoose = require("mongoose");
const { Schema } = mongoose;

const eventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: [true, "Event type is required"],
    trim: true,
    enum: {
      values: [
        "Application",
        "Integration",
        "Billing",
        "General",
        "Notifications",
      ],
      message: "Event type not available",
    },
  },
  eventName: {
    type: String,
    required: [true, "Event name is required"],
    trim: true,
    enum: {
      values: [
        //Payments
        "Payment Recieved",
        "Payment Rejected",
        //Units
        "Unit Created",
        "Unit Updated",
        "Unit Update Failed",
        "Unit Deleted",
        //Tenants
        "Tenant Created",
        "Tenant Assigned",
        "Tenant Updated",
        "Tenant Update Failed",
        "Tenant Deleted",
        //Facility
        "Facility Created",
        "Facility Updated",
        "Facility Update Failed",
        "Facility Deleted",
        "Facility Balancer",
        "Facility Delinquency",
        //Integrations
        //Notifications
        //Access Control
      ],
      message: "Event Name not availalbe",
    },
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StorageFacility",
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    minlength: [3, "Message must be at least 10 characters long"],
    maxlength: [500, "Message must be less than 500 characters long"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
