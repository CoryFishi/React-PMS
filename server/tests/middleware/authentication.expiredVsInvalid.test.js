import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import authenticate from "../../middleware/authentication.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

describe("F-203 JWT errors map to correct HTTP statuses", () => {
  it("returns 401 for an expired token", () => {
    const expired = jwt.sign({ id: "u1", role: "System_Admin" }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { cookies: { token: expired } };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 for a tampered token", () => {
    const ok = jwt.sign({ id: "u1", role: "System_Admin" }, process.env.JWT_SECRET);
    const tampered = ok.slice(0, -2) + "AA";
    const req = { cookies: { token: tampered } };
    const res = mockRes();
    authenticate(req, res, () => {});
    expect(res.statusCode).toBe(403);
  });
});
