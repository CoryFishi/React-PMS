import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";
import { hashPassword } from "../../helpers/password.js";
import User from "../../models/user.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("userController — F-107 regression: password hash must not leak", () => {
  it("GET /users/:userId does not return the password hash", async () => {
    const hash = await hashPassword("S3cret!secret");
    const victim = await makeUser({
      role: "Company_User",
      password: hash,
      confirmed: true,
    });

    const res = await api(app)
      .get(`/users/${victim._id.toString()}`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(hash);
  });

  it("POST /login does not return the password hash on success", async () => {
    const plain = "S3cret!login";
    const hash = await hashPassword(plain);
    const u = await User.create({
      displayName: "logintest1234",
      name: "Login Test",
      email: "logintest@example.com",
      address: {
        street1: "1 Login St",
        city: "Login City",
        state: "TX",
        zipCode: "12345",
        country: "US",
      },
      role: "Company_User",
      password: hash,
      confirmed: true,
      createdBy: admin._id,
    });

    const res = await api(app)
      .post("/login")
      .send({ email: u.email, password: plain });

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(hash);
  });

  it("PUT /users/update does not return the password hash", async () => {
    const hash = await hashPassword("EditMe!1234");
    const victim = await makeUser({
      role: "Company_User",
      password: hash,
      confirmed: true,
    });

    const res = await api(app)
      .put("/users/update")
      .set("Cookie", adminCookie)
      .send({ userId: victim._id.toString(), name: "Renamed User" });

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(hash);
  });
});
