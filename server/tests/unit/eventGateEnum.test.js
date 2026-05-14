import { describe, it, expect } from "vitest";
import Event from "../../models/event.js";
import mongoose from "mongoose";

describe("Event schema — gate enum values", () => {
  it.each(["Gate Provisioned", "Gate Revoked", "Gate Suspended", "Gate Unsuspended", "Gate Sync"])(
    "accepts %s as a valid eventName under Integration eventType",
    async (name) => {
      const ev = await Event.create({
        eventType: "Integration",
        eventName: name,
        message: "test event",
        company: new mongoose.Types.ObjectId(),
      });
      expect(ev.eventName).toBe(name);
    }
  );
});
