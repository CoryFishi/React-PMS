import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";

describe("Facility.settings billing/hours/contact/general", () => {
  it("applies defaults when settings groups are omitted", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    expect(f.settings.billing.gracePeriodDays).toBe(7);
    expect(f.settings.billing.lateFee.flatAmount).toBe(0);
    expect(f.settings.billing.lateFee.percentOfRent).toBe(0);
    expect(f.settings.billing.autoSuspendOnDelinquency).toBe(true);
    expect(f.settings.general.timezone).toBe("America/Chicago");
    expect(f.settings.general.currency).toBe("USD");
  });

  it("rejects percentOfRent above 100 and negative values", async () => {
    const c = await makeCompany();
    await expect(
      makeFacility(c, { settings: { billing: { lateFee: { percentOfRent: 150 } } } })
    ).rejects.toThrow();
    await expect(
      makeFacility(c, { settings: { billing: { gracePeriodDays: -1 } } })
    ).rejects.toThrow();
  });

  it("preserves amenities/unitTypes alongside new groups", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: {
        amenities: [{ name: "Lighting", priority: true }],
        contact: { announcement: "Holiday hours apply" },
      },
    });
    expect(f.settings.amenities[0].name).toBe("Lighting");
    expect(f.settings.contact.announcement).toBe("Holiday hours apply");
  });
});
