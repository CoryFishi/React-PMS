import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeUser } from "../helpers/factories.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let app;
beforeEach(() => {
  app = buildApp();
});

describe("GET /users/confirm/:userId — F-103 regression", () => {
  it("does NOT require a JWT cookie (returns 2xx or 3xx, never 401/403)", async () => {
    const user = await makeUser({ confirmed: false });
    const res = await api(app).get(`/users/confirm/${user._id.toString()}`);
    // The handler redirects (3xx) on success. It must not return 401/403.
    expect(res.status).toBeLessThan(400);
  });
});

describe("PUT /users/confirm/:userId — F-104 regression", () => {
  it("does NOT require a JWT cookie when user is unconfirmed", async () => {
    const user = await makeUser({ confirmed: false });
    const res = await api(app)
      .put(`/users/confirm/${user._id.toString()}`)
      .send({ password: "Str0ngPassword!" });
    // Should not return auth errors. May return 200 success or 400 validation.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe("userConfirmationEmail body — F-003 regression", () => {
  it("userController.js no longer contains hardcoded localhost:5173 in the confirm email path", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../../controllers/userController.js"),
      "utf8"
    );
    // The hardcoded URL must not appear in the userConfirmationEmail redirect URL.
    expect(src).not.toMatch(/`http:\/\/localhost:5173\/register\//);
  });
});
