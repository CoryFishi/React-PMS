import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import verifyDocusignHmac from "../../middleware/docusignHmac.js";

function mockRes() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
  };
}

function hmacFor(rawBody, key) {
  return crypto.createHmac("sha256", key).update(rawBody).digest("base64");
}

describe("docusignHmac middleware", () => {
  const KEY = "test-hmac-key";
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.DS_CONNECT_HMAC_KEY;
    process.env.DS_CONNECT_HMAC_KEY = KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.DS_CONNECT_HMAC_KEY;
    else process.env.DS_CONNECT_HMAC_KEY = originalKey;
  });

  it("calls next() and parses JSON body when HMAC matches", () => {
    const payload = JSON.stringify({ data: { envelopeId: "env_1" } });
    const buf = Buffer.from(payload);
    const req = { body: buf, headers: { "x-docusign-signature-1": hmacFor(buf, KEY) } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(req.body).toEqual({ data: { envelopeId: "env_1" } });
  });

  it("returns 401 when HMAC does not match", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "wrong-sig" } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when header is missing", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: {} };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("returns 503 when DS_CONNECT_HMAC_KEY is unset", () => {
    delete process.env.DS_CONNECT_HMAC_KEY;
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "anything" } };
    const res = mockRes();
    let nextCalled = false;

    verifyDocusignHmac(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(503);
  });

  it("does not crash on length-mismatched header", () => {
    const buf = Buffer.from(JSON.stringify({ data: {} }));
    const req = { body: buf, headers: { "x-docusign-signature-1": "short" } };
    const res = mockRes();
    let nextCalled = false;

    expect(() => verifyDocusignHmac(req, res, () => { nextCalled = true; })).not.toThrow();
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
