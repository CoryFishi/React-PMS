import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  passwordValidator,
} from "../../helpers/password.js";

describe("hashPassword", () => {
  it("returns a bcrypt hash string different from the input", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe("Sup3rSecret!");
    expect(hash.length).toBeGreaterThan(20);
  });
});

describe("comparePassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(comparePassword("Sup3rSecret!", hash)).resolves.toBe(true);
  });

  it("returns false for the wrong password", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(comparePassword("nope", hash)).resolves.toBe(false);
  });
});

describe("passwordValidator", () => {
  it("returns null for a strong password", () => {
    expect(passwordValidator("Sup3rSecret!")).toBeNull();
  });

  it("returns an error string for a too-short password", () => {
    const result = passwordValidator("abc");
    expect(typeof result).toBe("string");
    expect(result).toMatch(/8 characters/i);
  });

  it("returns an error string when missing an uppercase letter", () => {
    expect(typeof passwordValidator("nouppers1!")).toBe("string");
  });

  it("returns 'Password is required.' when given an empty string", () => {
    expect(passwordValidator("")).toBe("Password is required.");
  });
});
