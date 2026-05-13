import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-305 editNote returns a structured error rather than crashing", () => {
  it("returns 4xx/5xx JSON on an invalid ObjectId rather than an unhandled rejection", async () => {
    const res = await api(app)
      .patch(`/facilities/not-an-objectid/units/also-bad/notes/0`)
      .set("Cookie", adminCookie)
      .send({ note: "updated" });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
