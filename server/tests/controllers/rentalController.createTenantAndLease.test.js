import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";
import Tenant from "../../models/tenant.js";

vi.mock("../../services/leaseService.js", () => ({
  startRental: vi.fn(),
  createEnvelope: vi.fn(),
}));

import { startRental } from "../../services/leaseService.js";

let app;

beforeEach(async () => {
  startRental.mockReset();
  app = buildApp();
});

function tenantBody(overrides = {}) {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    firstName: "New",
    lastName: "Tenant",
    email: `nt-${stamp}@example.com`,
    username: `nt-${stamp}`,
    password: "ValidPassword1!",
    dateOfBirth: "1990-01-01",
    phone: "5125550000",
    street1: "1 A",
    city: "B",
    state: "TX",
    zipCode: "00000",
    country: "US",
    DLNumber: "DL1234",
    DLExpire: "2030-01-01",
    DLState: "TX",
    recoveryQuestion1: "q1",
    recoveryAnswer1: "a1",
    recoveryQuestion2: "q2",
    recoveryAnswer2: "a2",
    ...overrides,
  };
}

describe("POST /rental/:cid/:fid/:uid/rent — createTenantAndLease (tenant-only)", () => {
  it("creates Tenant 'New' and returns a tenant DTO, without calling startRental", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const info = tenantBody();

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: info });

    expect(res.status).toBe(200);
    expect(res.body.tenant).toBeTruthy();
    expect(res.body.tenant._id).toBeTruthy();
    expect(res.body.tenant.email).toBe(info.email);
    expect(res.body.tenant.status).toBe("New");
    expect(startRental).not.toHaveBeenCalled();

    const tenants = await Tenant.find({ company: company._id });
    expect(tenants).toHaveLength(1);
    expect(tenants[0].status).toBe("New");
  });

  it("does not leak password or recoveryQuestions in the DTO", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: tenantBody() });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.tenant).sort()).toEqual(
      ["_id", "email", "firstName", "lastName", "phone", "status"].sort()
    );
  });

  it("returns 400 when tenant email already exists", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const email = `dup-${Date.now()}@example.com`;
    await Tenant.create({
      firstName: "Existing",
      lastName: "Tenant",
      username: `existing-${Date.now()}`,
      password: "Hashed",
      dateOfBirth: "1990-01-01",
      company: company._id,
      contactInfo: { email },
      address: { street1: "1", city: "X", state: "TX", zipCode: "00000", country: "US" },
      vehicle: { DLNumber: "DL1", DLExpire: new Date("2030-01-01"), DLState: "TX" },
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: { email, password: "ValidPassword1!" } });

    expect(res.status).toBe(400);
    expect(startRental).not.toHaveBeenCalled();
  });

  it("returns 400 with a real message on invalid tenant info and persists no Tenant", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `weak-${Date.now()}@example.com`;

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({ tenantInfo: tenantBody({ email, password: "weak" }) });

    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
    const tenants = await Tenant.find({ "contactInfo.email": email });
    expect(tenants).toHaveLength(0);
  });
});
