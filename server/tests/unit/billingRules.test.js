// server/tests/unit/billingRules.test.js
import { describe, it, expect } from "vitest";
import {
  resolveGracePeriodDays,
  computeLateFee,
  isUnitOverdue,
} from "../../services/billingRules.js";

describe("resolveGracePeriodDays", () => {
  it("returns the facility setting when present", () => {
    expect(resolveGracePeriodDays({ settings: { billing: { gracePeriodDays: 14 } } })).toBe(14);
  });
  it("falls back to 7 when unset", () => {
    expect(resolveGracePeriodDays(null)).toBe(7);
    expect(resolveGracePeriodDays({})).toBe(7);
    expect(resolveGracePeriodDays({ settings: {} })).toBe(7);
  });
});

describe("computeLateFee", () => {
  it("sums flat + percent of monthly price", () => {
    expect(computeLateFee({ flatAmount: 25, percentOfRent: 10 }, 200)).toBe(45);
  });
  it("returns 0 when no fee configured", () => {
    expect(computeLateFee({ flatAmount: 0, percentOfRent: 0 }, 200)).toBe(0);
    expect(computeLateFee(undefined, 200)).toBe(0);
  });
  it("treats missing monthly price as 0 for the percent portion", () => {
    expect(computeLateFee({ flatAmount: 5, percentOfRent: 50 }, undefined)).toBe(5);
  });
});

describe("isUnitOverdue", () => {
  const now = new Date("2026-05-18T00:00:00Z");
  it("true when last-due date is older than grace period", () => {
    const unit = { lastMoveInDate: new Date("2026-04-01T00:00:00Z") };
    expect(isUnitOverdue(unit, 7, now)).toBe(true);
  });
  it("false when within grace period", () => {
    const unit = { paymentInfo: { paymentDate: new Date("2026-05-15T00:00:00Z") } };
    expect(isUnitOverdue(unit, 7, now)).toBe(false);
  });
  it("prefers paymentDate, then paymentInfo.paymentDate, then lastMoveInDate", () => {
    const unit = {
      paymentDate: new Date("2026-05-17T00:00:00Z"),
      paymentInfo: { paymentDate: new Date("2026-01-01T00:00:00Z") },
      lastMoveInDate: new Date("2026-01-01T00:00:00Z"),
    };
    expect(isUnitOverdue(unit, 7, now)).toBe(false);
  });
  it("false when no usable date is present", () => {
    expect(isUnitOverdue({}, 7, now)).toBe(false);
  });
});
