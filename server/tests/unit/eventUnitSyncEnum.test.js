import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";
import Event from "../../models/event.js";

describe("Event eventName — unit sync values", () => {
  for (const name of ["Gate Unit Created", "Gate Unit Deleted", "Gate Unit Sync"]) {
    it(`accepts "${name}" under Integration eventType`, async () => {
      const c = await makeCompany();
      const f = await makeFacility(c);
      const ev = await Event.create({
        eventType: "Integration",
        eventName: name,
        company: c._id,
        facility: f._id,
        message: "unit sync test event",
      });
      expect(ev.eventName).toBe(name);
    });
  }
});
