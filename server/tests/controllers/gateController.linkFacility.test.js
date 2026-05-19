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

describe("PUT/DELETE /facilities/:facilityId/gate/link", () => {
  it("links the facility to OpenTech", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/link`)
      .set("Cookie", adminCookie)
      .send({ opentechFacilityId: "ot_fac_1" });

    expect(res.status).toBe(200);
    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProvider).toBe("opentech");
    expect(reloaded.gateProviderRefs.opentech.facilityId).toBe("ot_fac_1");
  });

  it("rejects an empty opentechFacilityId with 400", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/link`)
      .set("Cookie", adminCookie)
      .send({ opentechFacilityId: "  " });

    expect(res.status).toBe(400);
  });

  it("unlinks the facility but preserves synced gateProviderRefs", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      gateProvider: "opentech",
      gateProviderRefs: {
        opentech: {
          facilityId: "ot_fac_1",
          timeGroups: [{ id: "tg1", name: "24x7", isDefault: true }],
          defaultTimeGroupId: "tg1",
        },
      },
    });

    const res = await api(app)
      .delete(`/facilities/${f._id}/gate/link`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    const reloaded = await StorageFacility.findById(f._id);
    expect(reloaded.gateProvider == null).toBe(true);
    expect(reloaded.gateProviderRefs.opentech.facilityId).toBe("ot_fac_1");
    expect(reloaded.gateProviderRefs.opentech.timeGroups).toHaveLength(1);
  });

  it("404s for an unknown facility", async () => {
    const res = await api(app)
      .put(`/facilities/64b2f0000000000000000000/gate/link`)
      .set("Cookie", adminCookie)
      .send({ opentechFacilityId: "x" });

    expect(res.status).toBe(404);
  });

  it("forbids a Company_Admin from another company", async () => {
    const facCompany = await makeCompany();
    const otherCompany = await makeCompany();
    const f = await makeFacility(facCompany);
    const ca = await makeUser({
      role: "Company_Admin",
      company: otherCompany._id,
    });
    const caCookie = cookieFor({ id: ca._id.toString(), role: ca.role });

    const res = await api(app)
      .put(`/facilities/${f._id}/gate/link`)
      .set("Cookie", caCookie)
      .send({ opentechFacilityId: "x" });

    expect(res.status).toBe(403);
  });
});
