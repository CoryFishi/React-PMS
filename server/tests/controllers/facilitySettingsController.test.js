// server/tests/controllers/facilitySettingsController.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";
import Facility from "../../models/facility.js";

let app, cookie;
beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString() });
});

describe("GET /facilities/:facilityId/settings", () => {
  it("returns the four settings groups with defaults", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app).get(`/facilities/${f._id}/settings`).set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.billing.gracePeriodDays).toBe(7);
    expect(res.body.general.currency).toBe("USD");
    expect(res.body).toHaveProperty("hours");
    expect(res.body).toHaveProperty("contact");
  });
});

describe("PUT /facilities/:facilityId/settings", () => {
  it("updates only the billing group and preserves amenities", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: { amenities: [{ name: "Gate", priority: true }] },
    });
    const res = await api(app)
      .put(`/facilities/${f._id}/settings`)
      .set("Cookie", cookie)
      .send({ billing: { gracePeriodDays: 14, lateFee: { flatAmount: 25, percentOfRent: 10 } } });
    expect(res.status).toBe(200);
    const reloaded = await Facility.findById(f._id);
    expect(reloaded.settings.billing.gracePeriodDays).toBe(14);
    expect(reloaded.settings.billing.lateFee.flatAmount).toBe(25);
    expect(reloaded.settings.amenities[0].name).toBe("Gate");
  });

  it("rejects invalid percentOfRent", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app)
      .put(`/facilities/${f._id}/settings`)
      .set("Cookie", cookie)
      .send({ billing: { lateFee: { percentOfRent: 250 } } });
    expect(res.status).toBe(400);
  });

  it("404s for a missing facility", async () => {
    const res = await api(app)
      .put(`/facilities/64b000000000000000000000/settings`)
      .set("Cookie", cookie)
      .send({ general: { currency: "EUR" } });
    expect(res.status).toBe(404);
  });
});
