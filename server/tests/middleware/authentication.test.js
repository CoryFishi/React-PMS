import { describe, it, expect } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import supertest from "supertest";
import authenticate from "../../middleware/authentication.js";
import { signJwt } from "../helpers/auth.js";

function app() {
  const a = express();
  a.use(cookieParser());
  a.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
  return a;
}

describe("authenticate middleware", () => {
  it("returns 401 when token cookie is missing", async () => {
    const res = await supertest(app()).get("/me");
    expect(res.status).toBe(401);
  });

  it("returns 403 when token is invalid", async () => {
    const res = await supertest(app()).get("/me").set("Cookie", "token=garbage");
    expect(res.status).toBe(403);
  });

  it("returns 403 when token is expired", async () => {
    const token = signJwt({ sub: "u1" }, { expiresIn: -1 });
    const res = await supertest(app()).get("/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(403);
  });

  it("attaches decoded user and calls next() on valid token", async () => {
    const token = signJwt({ sub: "u1", role: "System_Admin" });
    const res = await supertest(app()).get("/me").set("Cookie", `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.sub).toBe("u1");
    expect(res.body.user.role).toBe("System_Admin");
  });
});
