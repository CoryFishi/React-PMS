import { describe, it, expect } from "vitest";
import express from "express";
import supertest from "supertest";
import authenticateAPIKey from "../../middleware/apiKeyAuth.js";

function appWithMiddleware() {
  const app = express();
  app.get("/protected", authenticateAPIKey, (_req, res) => res.json({ ok: true }));
  return app;
}

describe("authenticateAPIKey", () => {
  it("returns 401 when x-api-key is missing", async () => {
    const res = await supertest(appWithMiddleware()).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/api key/i);
  });

  it("returns 401 when x-api-key is wrong", async () => {
    const res = await supertest(appWithMiddleware())
      .get("/protected")
      .set("x-api-key", "wrong");
    expect(res.status).toBe(401);
  });

  it("calls next() when x-api-key matches", async () => {
    const res = await supertest(appWithMiddleware())
      .get("/protected")
      .set("x-api-key", process.env.API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
