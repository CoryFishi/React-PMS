import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("PUT /facilities/update — F-304 runValidators on editFacility", () => {
  it("rejects an invalid email format instead of silently saving it", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);

    const res = await api(app)
      .put(`/facilities/update`)
      .set("Cookie", adminCookie)
      .query({ facilityId: facility._id.toString() })
      .send({ contactInfo: { email: "not-a-valid-email" } });

    // With runValidators: true the Mongoose match validator fires and the
    // update is rejected (controller catches and returns 500, which is still >= 400).
    expect(res.status).toBeGreaterThanOrEqual(400);

    // The invalid email must not have been persisted.
    const stored = await StorageFacility.findById(facility._id);
    expect(stored.contactInfo.email).not.toBe("not-a-valid-email");
  });
});

describe("PUT /facilities/update/status — F-304 runValidators on deployFacility", () => {
  it("rejects an invalid enum value instead of silently saving it", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);

    const res = await api(app)
      .put(`/facilities/update/status`)
      .set("Cookie", adminCookie)
      .query({ facilityId: facility._id.toString() })
      .send({ status: "NotARealStatus" });

    expect(res.status).toBeGreaterThanOrEqual(400);

    const stored = await StorageFacility.findById(facility._id);
    expect(stored.status).not.toBe("NotARealStatus");
  });
});
