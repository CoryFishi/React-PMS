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

describe("POST /rental/:cid/:fid/:uid/rent — createTenantAndLease", () => {
  it("creates Tenant with status 'New' and returns checkoutUrl on happy path", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    startRental.mockResolvedValue({
      checkoutUrl: "https://stripe.example/checkout/x",
      rentalId: "rental_abc",
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({
        tenantInfo: {
          firstName: "New",
          lastName: "Tenant",
          email: `nt-${Date.now()}@example.com`,
          username: `nt-${Date.now()}`,
          password: "ValidPassword1!",
          dateOfBirth: "1990-01-01",
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
        },
        successUrl: "https://app.example.test/s",
        cancelUrl: "https://app.example.test/c",
      });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBe("https://stripe.example/checkout/x");
    expect(startRental).toHaveBeenCalledTimes(1);

    const tenants = await Tenant.find({ company: company._id });
    expect(tenants).toHaveLength(1);
    expect(tenants[0].status).toBe("New");
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

  it("rolls back the created Tenant if Stripe session creation fails", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    startRental.mockRejectedValue(new Error("stripe boom"));

    const email = `rollback-${Date.now()}@example.com`;
    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/rent`)
      .send({
        tenantInfo: {
          firstName: "Roll",
          lastName: "Back",
          email,
          username: `rb-${Date.now()}`,
          password: "ValidPassword1!",
          dateOfBirth: "1990-01-01",
          street1: "1 A",
          city: "B",
          state: "TX",
          zipCode: "00000",
          country: "US",
          DLNumber: "DL1",
          DLExpire: "2030-01-01",
          DLState: "TX",
          recoveryQuestion1: "q1",
          recoveryAnswer1: "a1",
          recoveryQuestion2: "q2",
          recoveryAnswer2: "a2",
        },
        successUrl: "x",
        cancelUrl: "y",
      });

    expect(res.status).toBe(502);
    const tenants = await Tenant.find({ "contactInfo.email": email });
    expect(tenants).toHaveLength(0);
  });
});
