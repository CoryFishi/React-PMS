import { describe, it, expect } from "vitest";
import Event from "../../models/event.js";
import mongoose from "mongoose";

describe("Event schema — lease enum values", () => {
  it.each(["Lease Signed", "Lease Declined", "Lease Voided"])(
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

  it("rejects an unknown eventName", async () => {
    await expect(
      Event.create({
        eventType: "Integration",
        eventName: "Lease Bogus",
        message: "test event",
      })
    ).rejects.toThrow();
  });
});
