import { describe, it, expect, beforeEach } from "vitest";
import authenticateAPIKey from "../../middleware/apiKeyAuth.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  process.env.API_KEY = "the-real-key-1234567890";
});

describe("F-201/F-202 apiKeyAuth uses timing-safe compare with length guard", () => {
  it("rejects a shorter wrong key without throwing", () => {
    const req = { headers: { "x-api-key": "short" } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("rejects an equal-length wrong key", () => {
    const req = { headers: { "x-api-key": "X".repeat("the-real-key-1234567890".length) } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("calls next() for the correct key", () => {
    const req = { headers: { "x-api-key": "the-real-key-1234567890" } };
    const res = mockRes();
    let nextCalled = false;
    authenticateAPIKey(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
