import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let warnSpy;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("F-207 DocuSign env var naming", () => {
  it("warns when neither DS_PRIVATE_KEY_B64 nor DS_PRIVATE_KEY_B is set", async () => {
    const prevB64 = process.env.DS_PRIVATE_KEY_B64;
    const prevB = process.env.DS_PRIVATE_KEY_B;
    delete process.env.DS_PRIVATE_KEY_B64;
    delete process.env.DS_PRIVATE_KEY_B;
    vi.resetModules();

    await import("../../services/docusignClient.js");

    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(messages).toMatch(/DS_PRIVATE_KEY_B64/);

    if (prevB64 !== undefined) process.env.DS_PRIVATE_KEY_B64 = prevB64;
    if (prevB !== undefined) process.env.DS_PRIVATE_KEY_B = prevB;
  });

  it("warns deprecation when only DS_PRIVATE_KEY_B is set", async () => {
    const prevB64 = process.env.DS_PRIVATE_KEY_B64;
    delete process.env.DS_PRIVATE_KEY_B64;
    process.env.DS_PRIVATE_KEY_B = "dGVzdC1rZXk=";
    vi.resetModules();

    await import("../../services/docusignClient.js");

    const messages = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(messages).toMatch(/DS_PRIVATE_KEY_B\b/);
    expect(messages).toMatch(/DS_PRIVATE_KEY_B64/);

    if (prevB64 !== undefined) process.env.DS_PRIVATE_KEY_B64 = prevB64;
  });
});
