import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany, makeFacility, oid } from "../helpers/factories.js";
import StorageFacility from "../../models/facility.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("POST /facilities/create — F-007 mass-assignment regression (create)", () => {
  it("ignores attacker-supplied 'status' and 'createdBy' fields", async () => {
    const realCompany = await makeCompany();

    const payload = {
      facilityName: "Test Facility F007",
      company: realCompany._id.toString(),
      address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
      contactInfo: { phone: "5550100000", email: "x@example.com" },
      // ATTACKER-supplied fields that must be ignored:
      status: "Enabled",              // should stay at schema default "Pending Deployment"
      createdBy: oid(),               // should be set server-side from req.user
    };

    const res = await api(app)
      .post("/facilities/create")
      .set("Cookie", adminCookie)
      .send(payload);

    // Request should succeed (2xx)
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const stored = await StorageFacility.findOne({ facilityName: "Test Facility F007" });
    expect(stored).not.toBeNull();

    // status must NOT be the attacker-supplied "Enabled"; schema default is "Pending Deployment"
    expect(stored.status).not.toBe("Enabled");
    expect(stored.status).toBe("Pending Deployment");

    // createdBy must be the authenticated admin, not the attacker's random oid
    expect(stored.createdBy.toString()).toBe(admin._id.toString());
  });
});

describe("PUT /facilities/update — F-007 mass-assignment regression (edit)", () => {
  it("ignores attacker-supplied 'company', 'status', and 'createdBy' fields during edit", async () => {
    const legitimateCompany = await makeCompany();
    const hostileCompany = await makeCompany();
    const facility = await makeFacility(legitimateCompany, {
      status: "Pending Deployment",
      createdBy: admin._id,
    });

    const attackPayload = {
      facilityName: "Renamed Facility",
      company: hostileCompany._id.toString(),   // ATTACKER tries to reassign company
      status: "Enabled",                         // ATTACKER tries to bypass deployment
      createdBy: oid(),                          // ATTACKER tries to change creator
    };

    const res = await api(app)
      .put("/facilities/update")
      .set("Cookie", adminCookie)
      .query({ facilityId: facility._id.toString() })
      .send(attackPayload);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const stored = await StorageFacility.findById(facility._id);
    expect(stored).not.toBeNull();

    // facilityName update is legitimate and should be applied
    expect(stored.facilityName).toBe("Renamed Facility");

    // company must not be changed to the hostile one
    expect(stored.company.toString()).toBe(legitimateCompany._id.toString());

    // status must not be changed via editFacility — it should remain "Pending Deployment"
    expect(stored.status).not.toBe("Enabled");
    expect(stored.status).toBe("Pending Deployment");

    // createdBy must not be changed
    expect(stored.createdBy.toString()).toBe(admin._id.toString());
  });
});

describe("PUT /facilities/update/status — F-007 mass-assignment regression (deploy)", () => {
  it("only updates status and ignores company/createdBy in body", async () => {
    const company = await makeCompany();
    const hostileCompany = await makeCompany();
    const facility = await makeFacility(company, {
      status: "Pending Deployment",
      createdBy: admin._id,
    });

    const attackPayload = {
      status: "Enabled",                         // the only legitimate field
      company: hostileCompany._id.toString(),    // ATTACKER tries to reassign company
      createdBy: oid(),                          // ATTACKER tries to change creator
    };

    const res = await api(app)
      .put("/facilities/update/status")
      .set("Cookie", adminCookie)
      .query({ facilityId: facility._id.toString() })
      .send(attackPayload);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const stored = await StorageFacility.findById(facility._id);
    expect(stored).not.toBeNull();

    // status transition is permitted
    expect(stored.status).toBe("Enabled");

    // company must not be changed
    expect(stored.company.toString()).toBe(company._id.toString());

    // createdBy must not be changed
    expect(stored.createdBy.toString()).toBe(admin._id.toString());
  });
});
