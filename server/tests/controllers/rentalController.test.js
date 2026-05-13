import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import { hashPassword } from "../../helpers/password.js";

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

describe("POST /rental/:cid/:fid/:uid/login&rent — formerly F-001 stub", () => {
  it("returns 200 + checkoutUrl on valid creds", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `tenant-${Date.now()}@example.com`;
    await makeTenant({
      company: company._id,
      contactInfo: { email },
      password: await hashPassword("ValidPassword1!"),
    });

    startRental.mockResolvedValue({
      checkoutUrl: "https://stripe.example/checkout/login-x",
      rentalId: "rental_login_x",
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({
        email,
        password: "ValidPassword1!",
        successUrl: "https://app.example.test/s",
        cancelUrl: "https://app.example.test/c",
      });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBe("https://stripe.example/checkout/login-x");
    expect(startRental).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when no tenant with that email exists", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ email: "nobody@example.com", password: "anything" });

    expect(res.status).toBe(401);
    expect(startRental).not.toHaveBeenCalled();
  });

  it("returns 401 when password is wrong", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);
    const email = `wp-${Date.now()}@example.com`;
    await makeTenant({
      company: company._id,
      contactInfo: { email },
      password: await hashPassword("ValidPassword1!"),
    });

    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ email, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
    expect(startRental).not.toHaveBeenCalled();
  });
});
