# Facility-Level Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-facility settings (billing/delinquency rules, hours, contact/display info, general prefs) with an admin-only API and a client Settings tab, and wire the billing rules into the delinquency job.

**Architecture:** Settings are embedded under `Facility.settings.*` (additive — `amenities`/`unitTypes` untouched). Two new routes `GET/PUT /facilities/:facilityId/settings` mirror the existing `/facilities/:facilityId/gate/*` sub-resource pattern, guarded by a new `requireFacilityAdmin` middleware (first server-side role guard). Pure, unit-tested helpers in `services/billingRules.js` compute grace period / late fee / overdue; `processes/delinquency.js` consumes them and uses a per-Rental `lateFeeAppliedAt` marker for one-time-fee idempotency.

**Tech Stack:** Node ESM, Express 4, Mongoose 8, Vitest + supertest + mongodb-memory-server, React 18 + Vite + Tailwind, axios, react-hot-toast.

**Design deviation from spec:** The spec assumed `lateFeeAppliedAt` is cleared "on the payment path that resets delinquency." No such path exists in the codebase (nothing transitions a tenant from `Delinquent` back to `Rented`). Instead, the delinquency job clears `lateFeeAppliedAt` whenever a unit is no longer overdue — self-contained and robust. Also, `isUnitOverdue` reads `unit.paymentDate ?? unit.paymentInfo?.paymentDate ?? unit.lastMoveInDate` because `unit.paymentDate` (read by the current code) is not a persisted schema field; `lastMoveInDate` is. This is a scoped correctness improvement to the code being modified, not an unrelated refactor.

---

## File Structure

- Create: `server/services/billingRules.js` — pure helpers: `resolveGracePeriodDays`, `computeLateFee`, `isUnitOverdue`.
- Create: `server/middleware/requireFacilityAdmin.js` — role guard.
- Create: `server/controllers/facilitySettingsController.js` — `getFacilitySettings`, `updateFacilitySettings`.
- Modify: `server/models/facility.js` — extend `settings` with `billing`, `hours`, `contact`, `general`.
- Modify: `server/models/rental.js` — add `lateFeeAppliedAt`.
- Modify: `server/routes/facilityRoutes.js` — wire the two routes before the `/:facilityId` catch-all.
- Modify: `server/processes/delinquency.js` — consume billingRules, apply one-time late fee, honor `autoSuspendOnDelinquency`.
- Create (client): `client/src/components/facilityComponents/FacilitySettings.jsx` — Settings tab UI.
- Modify (client): the facility detail page that renders facility sub-tabs — add the Settings tab.
- Modify: root `CLAUDE.md`, `server/CLAUDE.md`, `README.md` — docs.

Test files (mirror source layout under `server/tests/`):
- `server/tests/unit/facilitySettingsSchema.test.js`
- `server/tests/unit/rentalLateFeeField.test.js`
- `server/tests/unit/billingRules.test.js`
- `server/tests/middleware/requireFacilityAdmin.test.js`
- `server/tests/controllers/facilitySettingsController.test.js`
- `server/tests/routes/facilitySettingsRoutes.test.js`
- `server/tests/unit/delinquencyLateFee.test.js`

---

## Task 1: Extend Facility schema with settings sub-objects

**Files:**
- Modify: `server/models/facility.js` (the `settings: { ... }` block, currently ending at the `unitTypes` array around line 121)
- Test: `server/tests/unit/facilitySettingsSchema.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/unit/facilitySettingsSchema.test.js
import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility } from "../helpers/factories.js";

describe("Facility.settings billing/hours/contact/general", () => {
  it("applies defaults when settings groups are omitted", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    expect(f.settings.billing.gracePeriodDays).toBe(7);
    expect(f.settings.billing.lateFee.flatAmount).toBe(0);
    expect(f.settings.billing.lateFee.percentOfRent).toBe(0);
    expect(f.settings.billing.autoSuspendOnDelinquency).toBe(true);
    expect(f.settings.general.timezone).toBe("America/Chicago");
    expect(f.settings.general.currency).toBe("USD");
  });

  it("rejects percentOfRent above 100 and negative values", async () => {
    const c = await makeCompany();
    await expect(
      makeFacility(c, { settings: { billing: { lateFee: { percentOfRent: 150 } } } })
    ).rejects.toThrow();
    await expect(
      makeFacility(c, { settings: { billing: { gracePeriodDays: -1 } } })
    ).rejects.toThrow();
  });

  it("preserves amenities/unitTypes alongside new groups", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: {
        amenities: [{ name: "Lighting", priority: true }],
        contact: { announcement: "Holiday hours apply" },
      },
    });
    expect(f.settings.amenities[0].name).toBe("Lighting");
    expect(f.settings.contact.announcement).toBe("Holiday hours apply");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/unit/facilitySettingsSchema.test.js`
Expected: FAIL — defaults undefined / validation not enforced.

- [ ] **Step 3: Extend the schema**

In `server/models/facility.js`, inside the `settings: { ... }` object (sibling of `amenities` and `unitTypes`), add:

```javascript
    billing: {
      type: new mongoose.Schema(
        {
          gracePeriodDays: { type: Number, default: 7, min: 0 },
          lateFee: {
            flatAmount: { type: Number, default: 0, min: 0 },
            percentOfRent: { type: Number, default: 0, min: 0, max: 100 },
          },
          autoSuspendOnDelinquency: { type: Boolean, default: true },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    hours: {
      office: [
        {
          day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          open: { type: String },
          close: { type: String },
          closed: { type: Boolean, default: false },
        },
      ],
      gateAccess: [
        {
          day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          open: { type: String },
          close: { type: String },
          closed: { type: Boolean, default: false },
        },
      ],
    },
    contact: {
      publicPhone: { type: String, trim: true },
      publicEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
      },
      announcement: { type: String, trim: true, maxlength: 1000 },
    },
    general: {
      type: new mongoose.Schema(
        {
          timezone: { type: String, default: "America/Chicago" },
          currency: { type: String, default: "USD" },
          notificationEmailOverride: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
          },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
```

Using nested sub-schemas with `default: () => ({})` for `billing` and `general` guarantees their inner defaults materialize even when `settings` is entirely omitted (the test asserts `f.settings.billing.gracePeriodDays === 7` on a facility created without any settings).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/unit/facilitySettingsSchema.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Lint and commit**

```bash
cd server && npm run lint
git add server/models/facility.js server/tests/unit/facilitySettingsSchema.test.js
git commit -m "feat: add billing/hours/contact/general to Facility.settings"
```

---

## Task 2: Add lateFeeAppliedAt to Rental schema

**Files:**
- Modify: `server/models/rental.js` (add field after `gateProvisionError: { type: String },` ~line 88)
- Test: `server/tests/unit/rentalLateFeeField.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/unit/rentalLateFeeField.test.js
import { describe, it, expect } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant, makeRental } from "../helpers/factories.js";

describe("Rental.lateFeeAppliedAt", () => {
  it("defaults to null and accepts a Date", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);
    const t = await makeTenant({ company: c._id });
    const r = await makeRental(u, t, {
      company: c._id,
      facility: f._id,
      unit: u._id,
      amount: 100,
      status: "paid",
    });
    expect(r.lateFeeAppliedAt ?? null).toBeNull();
    r.lateFeeAppliedAt = new Date("2026-05-18");
    await r.save();
    expect(r.lateFeeAppliedAt.toISOString()).toContain("2026-05-18");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/unit/rentalLateFeeField.test.js`
Expected: FAIL — field stripped by strict mode, save/read does not round-trip.

- [ ] **Step 3: Add the field**

In `server/models/rental.js`, add inside the schema directly after `gateProvisionError: { type: String },`:

```javascript
    lateFeeAppliedAt: {
      type: Date,
      default: null,
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/unit/rentalLateFeeField.test.js`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

```bash
cd server && npm run lint
git add server/models/rental.js server/tests/unit/rentalLateFeeField.test.js
git commit -m "feat: add lateFeeAppliedAt marker to Rental"
```

---

## Task 3: Pure billing-rules helpers

**Files:**
- Create: `server/services/billingRules.js`
- Test: `server/tests/unit/billingRules.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
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
    expect(computeLateFee({ flatAmount: 25, percentOfRent: 10 }, 200)).toBe(45); // 25 + 20
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/unit/billingRules.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```javascript
// server/services/billingRules.js

export function resolveGracePeriodDays(facility) {
  const v = facility?.settings?.billing?.gracePeriodDays;
  return Number.isFinite(v) && v >= 0 ? v : 7;
}

export function computeLateFee(lateFeeSettings, monthlyPrice) {
  const flat = Number(lateFeeSettings?.flatAmount) || 0;
  const pct = Number(lateFeeSettings?.percentOfRent) || 0;
  const price = Number(monthlyPrice) || 0;
  return flat + (pct / 100) * price;
}

function dueDateOf(unit) {
  return (
    unit?.paymentDate ??
    unit?.paymentInfo?.paymentDate ??
    unit?.lastMoveInDate ??
    null
  );
}

export function isUnitOverdue(unit, gracePeriodDays, now = new Date()) {
  const due = dueDateOf(unit);
  if (!due) return false;
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - gracePeriodDays);
  return new Date(due) < threshold;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/unit/billingRules.test.js`
Expected: PASS (all describes).

- [ ] **Step 5: Lint and commit**

```bash
cd server && npm run lint
git add server/services/billingRules.js server/tests/unit/billingRules.test.js
git commit -m "feat: pure billing-rules helpers (grace period, late fee, overdue)"
```

---

## Task 4: requireFacilityAdmin middleware

**Files:**
- Create: `server/middleware/requireFacilityAdmin.js`
- Test: `server/tests/middleware/requireFacilityAdmin.test.js`

Reads the facility id from `req.params.facilityId`. Loads the user by `req.user._id || req.user.id` (real tokens carry `_id`; the test cookie helper signs `{ id, role }` — do NOT trust `req.user.role`, always read role from the DB user).

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/middleware/requireFacilityAdmin.test.js
import { describe, it, expect, vi } from "vitest";
import requireFacilityAdmin from "../../middleware/requireFacilityAdmin.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

function res() {
  return {
    statusCode: 0,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe("requireFacilityAdmin", () => {
  it("allows System_Admin", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const admin = await makeUser({ role: "System_Admin" });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: admin._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows Company_Admin of the same company", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const ca = await makeUser({ role: "Company_Admin", company: c._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: ca._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("403s a Company_Admin from a different company", async () => {
    const c1 = await makeCompany();
    const c2 = await makeCompany();
    const f = await makeFacility(c1);
    const ca = await makeUser({ role: "Company_Admin", company: c2._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: ca._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(next).not.toHaveBeenCalled();
    expect(r.statusCode).toBe(403);
  });

  it("403s a Company_User", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const cu = await makeUser({ role: "Company_User", company: c._id });
    const req = { params: { facilityId: f._id.toString() }, user: { _id: cu._id.toString() } };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(r.statusCode).toBe(403);
  });

  it("401s when no authenticated user id", async () => {
    const req = { params: { facilityId: "x" }, user: {} };
    const r = res();
    const next = vi.fn();
    await requireFacilityAdmin(req, r, next);
    expect(r.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/middleware/requireFacilityAdmin.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the middleware**

```javascript
// server/middleware/requireFacilityAdmin.js
import User from "../models/user.js";
import StorageFacility from "../models/facility.js";

const requireFacilityAdmin = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(userId).select("role company");
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.role === "System_Admin") return next();

    if (user.role === "Company_Admin") {
      const facility = await StorageFacility.findById(req.params.facilityId).select("company");
      if (!facility) return res.status(404).json({ message: "Facility not found" });
      if (user.company && facility.company?.toString() === user.company.toString()) {
        return next();
      }
    }

    return res.status(403).json({ message: "Forbidden: facility admin access required" });
  } catch (err) {
    console.error("requireFacilityAdmin error:", err);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export default requireFacilityAdmin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/middleware/requireFacilityAdmin.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Lint and commit**

```bash
cd server && npm run lint
git add server/middleware/requireFacilityAdmin.js server/tests/middleware/requireFacilityAdmin.test.js
git commit -m "feat: requireFacilityAdmin role guard middleware"
```

---

## Task 5: Facility settings controller (GET + PUT with deep-merge)

**Files:**
- Create: `server/controllers/facilitySettingsController.js`
- Modify: `server/routes/facilityRoutes.js`
- Test: `server/tests/controllers/facilitySettingsController.test.js`

PUT writes dotted `settings.<group>` paths via `$set` so `amenities`/`unitTypes` and untouched groups are preserved. Accepts any subset of `billing`, `hours`, `contact`, `general`.

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/controllers/facilitySettingsController.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";
import Facility from "../../models/facility.js";

let app, cookie;
beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  cookie = cookieFor({ id: admin._id.toString() });
});

describe("GET /facilities/:facilityId/settings", () => {
  it("returns the four settings groups with defaults", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app).get(`/facilities/${f._id}/settings`).set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.billing.gracePeriodDays).toBe(7);
    expect(res.body.general.currency).toBe("USD");
    expect(res.body).toHaveProperty("hours");
    expect(res.body).toHaveProperty("contact");
  });
});

describe("PUT /facilities/:facilityId/settings", () => {
  it("updates only the billing group and preserves amenities", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: { amenities: [{ name: "Gate", priority: true }] },
    });
    const res = await api(app)
      .put(`/facilities/${f._id}/settings`)
      .set("Cookie", cookie)
      .send({ billing: { gracePeriodDays: 14, lateFee: { flatAmount: 25, percentOfRent: 10 } } });
    expect(res.status).toBe(200);
    const reloaded = await Facility.findById(f._id);
    expect(reloaded.settings.billing.gracePeriodDays).toBe(14);
    expect(reloaded.settings.billing.lateFee.flatAmount).toBe(25);
    expect(reloaded.settings.amenities[0].name).toBe("Gate");
  });

  it("rejects invalid percentOfRent", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app)
      .put(`/facilities/${f._id}/settings`)
      .set("Cookie", cookie)
      .send({ billing: { lateFee: { percentOfRent: 250 } } });
    expect(res.status).toBe(400);
  });

  it("404s for a missing facility", async () => {
    const res = await api(app)
      .put(`/facilities/64b000000000000000000000/settings`)
      .set("Cookie", cookie)
      .send({ general: { currency: "EUR" } });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/controllers/facilitySettingsController.test.js`
Expected: FAIL — controller/routes not wired (404/500).

- [ ] **Step 3: Implement the controller**

```javascript
// server/controllers/facilitySettingsController.js
import StorageFacility from "../models/facility.js";
import Event from "../models/event.js";

const GROUPS = ["billing", "hours", "contact", "general"];

function shape(settings) {
  const s = settings || {};
  return {
    billing: s.billing ?? {},
    hours: s.hours ?? { office: [], gateAccess: [] },
    contact: s.contact ?? {},
    general: s.general ?? {},
  };
}

export const getFacilitySettings = async (req, res) => {
  try {
    const facility = await StorageFacility.findById(req.params.facilityId).select("settings");
    if (!facility) return res.status(404).json({ message: "Facility not found" });
    return res.json(shape(facility.settings));
  } catch (err) {
    console.error("getFacilitySettings error:", err);
    return res.status(500).json({ message: "Failed to load facility settings" });
  }
};

export const updateFacilitySettings = async (req, res) => {
  try {
    const facility = await StorageFacility.findById(req.params.facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    const update = {};
    for (const g of GROUPS) {
      if (req.body[g] !== undefined) update[`settings.${g}`] = req.body[g];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid settings groups provided" });
    }

    const updated = await StorageFacility.findByIdAndUpdate(
      req.params.facilityId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("settings facilityName");

    await Event.create({
      eventType: "Application",
      eventName: "Facility Settings Updated",
      message: `${facility.facilityName} settings updated`,
      facility: facility._id,
    });

    return res.json(shape(updated.settings));
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("updateFacilitySettings error:", err);
    return res.status(500).json({ message: "Failed to update facility settings" });
  }
};
```

- [ ] **Step 4: Wire the routes (required for the test to pass)**

In `server/routes/facilityRoutes.js`, add near the other controller imports (top of file):

```javascript
import * as facilitySettingsController from "../controllers/facilitySettingsController.js";
import requireFacilityAdmin from "../middleware/requireFacilityAdmin.js";
```

Add these two routes **immediately before** the final `router.get("/:facilityId", ...)` catch-all (~line 186), after the `/:facilityId/gate/*` routes:

```javascript
router.get(
  "/:facilityId/settings",
  authenticateAPIKey,
  authenticate,
  requireFacilityAdmin,
  facilitySettingsController.getFacilitySettings
);
router.put(
  "/:facilityId/settings",
  authenticateAPIKey,
  authenticate,
  requireFacilityAdmin,
  facilitySettingsController.updateFacilitySettings
);
```

The existing `/:facilityId/settings/unittypes` and `/:facilityId/settings/amenities` routes are full-path matches and are not shadowed by the new exact `/:facilityId/settings` route.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run tests/controllers/facilitySettingsController.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Lint and commit**

```bash
cd server && npm run lint
git add server/controllers/facilitySettingsController.js server/routes/facilityRoutes.js server/tests/controllers/facilitySettingsController.test.js
git commit -m "feat: facility settings GET/PUT endpoints with deep-merge"
```

---

## Task 6: Route auth-layer test

**Files:**
- Test: `server/tests/routes/facilitySettingsRoutes.test.js`

Proves both middleware layers (API key + JWT) and the new role guard reject correctly.

- [ ] **Step 1: Write the test**

```javascript
// server/tests/routes/facilitySettingsRoutes.test.js
import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeCompany, makeFacility, makeUser } from "../helpers/factories.js";

let app;
beforeEach(() => { app = buildApp(); });

describe("settings route auth layers", () => {
  it("rejects without API key", async () => {
    const res = await supertest(app).get("/facilities/abc/settings");
    expect([401, 403]).toContain(res.status);
  });

  it("401 with API key but no JWT cookie", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const res = await api(app).get(`/facilities/${f._id}/settings`);
    expect(res.status).toBe(401);
  });

  it("403 for an authenticated Company_User", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const cu = await makeUser({ role: "Company_User", company: c._id });
    const res = await api(app)
      .get(`/facilities/${f._id}/settings`)
      .set("Cookie", cookieFor({ id: cu._id.toString() }));
    expect(res.status).toBe(403);
  });

  it("200 for System_Admin", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const admin = await makeUser({ role: "System_Admin" });
    const res = await api(app)
      .get(`/facilities/${f._id}/settings`)
      .set("Cookie", cookieFor({ id: admin._id.toString() }));
    expect(res.status).toBe(200);
  });
});
```

Note: the no-API-key expectation is `[401, 403]` to match whatever `server/middleware/apiKeyAuth.js` returns — do not modify that middleware.

- [ ] **Step 2: Run test**

Run: `cd server && npx vitest run tests/routes/facilitySettingsRoutes.test.js`
Expected: PASS (4 tests) — routes wired in Task 5.

- [ ] **Step 3: Commit**

```bash
git add server/tests/routes/facilitySettingsRoutes.test.js
git commit -m "test: facility settings route auth-layer coverage"
```

---

## Task 7: Wire per-facility grace period + one-time late fee into delinquency job

**Files:**
- Modify: `server/processes/delinquency.js`
- Test: `server/tests/unit/delinquencyLateFee.test.js`

Behavioral changes:
1. Replace the hardcoded 7-day `oneWeekAgo` with per-facility `resolveGracePeriodDays` + `isUnitOverdue`.
2. On Rented→Delinquent transition, apply `computeLateFee` once per delinquency cycle, guarded by `Rental.lateFeeAppliedAt`. `$inc` the tenant `balance`.
3. Clear `lateFeeAppliedAt` for rentals whose unit is no longer overdue.
4. Skip `gateService.suspendUnit` when `settings.billing.autoSuspendOnDelinquency === false`, but still mark `Delinquent`.

- [ ] **Step 1: Write the failing test**

```javascript
// server/tests/unit/delinquencyLateFee.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateTenantStatus } from "../../processes/delinquency.js";
import Tenant from "../../models/tenant.js";
import {
  makeCompany, makeFacility, makeUnit, makeTenant, makeRental,
} from "../helpers/factories.js";

vi.mock("../../services/gateService.js", () => ({
  suspendUnit: vi.fn().mockResolvedValue(undefined),
}));
import * as gateService from "../../services/gateService.js";

beforeEach(() => vi.clearAllMocks());

async function seedOverdue({ billing }) {
  const c = await makeCompany();
  const f = await makeFacility(c, { settings: { billing } });
  const old = new Date();
  old.setDate(old.getDate() - 60);
  const u = await makeUnit(f, {
    status: "Rented",
    lastMoveInDate: old,
    paymentInfo: { pricePerMonth: 200 },
  });
  const t = await makeTenant({ company: c._id, status: "Rented", units: [u._id], balance: 0 });
  await makeRental(u, t, {
    company: c._id, facility: f._id, unit: u._id, amount: 200, status: "paid",
  });
  return { f, u, t };
}

describe("delinquency late fee + grace period", () => {
  it("marks delinquent and applies flat+percent fee once", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, lateFee: { flatAmount: 25, percentOfRent: 10 } },
    });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Delinquent");
    expect(reloaded.balance).toBe(45); // 25 + 10% of 200
  });

  it("does not double-charge on a second run", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, lateFee: { flatAmount: 25, percentOfRent: 10 } },
    });
    await updateTenantStatus({ disconnect: false });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.balance).toBe(45);
  });

  it("honors a longer grace period (not yet overdue)", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c, {
      settings: { billing: { gracePeriodDays: 90, lateFee: { flatAmount: 25, percentOfRent: 0 } } },
    });
    const d = new Date(); d.setDate(d.getDate() - 30);
    const u = await makeUnit(f, { status: "Rented", lastMoveInDate: d, paymentInfo: { pricePerMonth: 200 } });
    const t = await makeTenant({ company: c._id, status: "Rented", units: [u._id], balance: 0 });
    await makeRental(u, t, { company: c._id, facility: f._id, unit: u._id, amount: 200, status: "paid" });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Rented");
    expect(reloaded.balance).toBe(0);
  });

  it("skips gate suspend when autoSuspendOnDelinquency is false but still marks delinquent", async () => {
    const { t } = await seedOverdue({
      billing: { gracePeriodDays: 7, autoSuspendOnDelinquency: false, lateFee: { flatAmount: 10, percentOfRent: 0 } },
    });
    await updateTenantStatus({ disconnect: false });
    const reloaded = await Tenant.findById(t._id);
    expect(reloaded.status).toBe("Delinquent");
    expect(gateService.suspendUnit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run tests/unit/delinquencyLateFee.test.js`
Expected: FAIL — fees not applied, grace period hardcoded.

- [ ] **Step 3: Rewrite the loop in `server/processes/delinquency.js`**

Add imports after the existing imports at the top:

```javascript
import Rental from "../models/rental.js";
import {
  resolveGracePeriodDays,
  computeLateFee,
  isUnitOverdue,
} from "../services/billingRules.js";
```

Replace everything from `const oneWeekAgo = new Date();` through the end of the tenant `for` loop (currently lines ~24–61) with:

```javascript
    const now = new Date();
    const facilityCountMap = new Map();
    const facilityCache = new Map();

    const tenants = await Tenant.find({ status: "Rented" }).populate("units").lean();
    let updatedCount = 0;

    for (const tenant of tenants) {
      let hasOverdueUnit = false;

      for (const unit of tenant.units) {
        const facilityId = unit.facility?.toString();
        if (!facilityId) continue;

        let facility = facilityCache.get(facilityId);
        if (facility === undefined) {
          facility = await StorageFacility.findById(facilityId).select(
            "settings facilityName"
          );
          facilityCache.set(facilityId, facility);
        }

        const graceDays = resolveGracePeriodDays(facility);
        const overdue = isUnitOverdue(unit, graceDays, now);

        const rental = await Rental.findOne({
          unit: unit._id,
          tenant: tenant._id,
        }).sort({ createdAt: -1 });

        if (!overdue) {
          if (rental && rental.lateFeeAppliedAt) {
            rental.lateFeeAppliedAt = null;
            await rental.save();
          }
          continue;
        }

        hasOverdueUnit = true;
        facilityCountMap.set(
          facilityId,
          (facilityCountMap.get(facilityId) || 0) + 1
        );

        if (rental && !rental.lateFeeAppliedAt) {
          const fee = computeLateFee(
            facility?.settings?.billing?.lateFee,
            unit.paymentInfo?.pricePerMonth
          );
          if (fee > 0) {
            await Tenant.updateOne(
              { _id: tenant._id },
              { $inc: { balance: fee } }
            );
          }
          rental.lateFeeAppliedAt = now;
          await rental.save();
        }

        const autoSuspend =
          facility?.settings?.billing?.autoSuspendOnDelinquency !== false;
        if (autoSuspend) {
          try {
            await gateService.suspendUnit({ unitId: unit._id });
          } catch (gateErr) {
            console.error(
              `Gate suspend failed for unit ${unit._id}:`,
              gateErr.message
            );
          }
        }
      }

      if (hasOverdueUnit) {
        await Tenant.updateOne(
          { _id: tenant._id },
          { $set: { status: "Delinquent" } }
        );
        updatedCount++;
      }
    }
```

The existing code below this (the `console.log` + `facilityCountMap` Event loop + `catch`/`finally`) is unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run tests/unit/delinquencyLateFee.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the full server suite (no regressions)**

Run: `cd server && npm test`
Expected: All prior tests still pass plus the new ones. If a pre-existing delinquency test asserted the old hardcoded behavior, update only that test's expectations to the configurable equivalent (default 7 days is the same boundary) and note it in the commit message. Do not change unrelated tests.

- [ ] **Step 6: Lint and commit**

```bash
cd server && npm run lint
git add server/processes/delinquency.js server/tests/unit/delinquencyLateFee.test.js
git commit -m "feat: per-facility grace period + one-time late fee in delinquency job"
```

---

## Task 8: Client Settings tab

**Files:**
- Create: `client/src/components/facilityComponents/FacilitySettings.jsx`
- Modify: the facility detail page that renders facility sub-tabs. Find it with:
  `cd client && grep -rl "facilityComponents\|gate/status" src` (pick the page/component that renders the tab strip for a single facility).

No client test suite exists; verification is manual (Step 4).

- [ ] **Step 1: Implement the component**

Create `client/src/components/facilityComponents/FacilitySettings.jsx`. Follow existing facility-component conventions (axios with `withCredentials` + the `x-api-key` header used elsewhere in the client; Tailwind; `react-hot-toast`). Minimum viable (Billing group fully wired; Hours/Contact/General follow the identical pattern as added `<section>` blocks):

```jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function FacilitySettings({ facilityId }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const cfg = {
    withCredentials: true,
    headers: { "x-api-key": import.meta.env.VITE_API_KEY },
  };
  const base = `${import.meta.env.VITE_API_URL}/facilities/${facilityId}/settings`;

  useEffect(() => {
    axios
      .get(base, cfg)
      .then((r) => setSettings(r.data))
      .catch(() => toast.error("Failed to load settings"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  if (!settings) return <div className="p-4">Loading settings…</div>;

  const save = async (group, value) => {
    setSaving(true);
    try {
      const r = await axios.put(base, { [group]: value }, cfg);
      setSettings(r.data);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const b = settings.billing || {};
  return (
    <div className="p-4 space-y-6">
      <section className="border rounded p-4">
        <h3 className="font-semibold mb-2">Billing &amp; Delinquency</h3>
        <label className="block text-sm">
          Grace period (days)
          <input
            type="number"
            min={0}
            defaultValue={b.gracePeriodDays ?? 7}
            className="border rounded px-2 py-1 ml-2 w-24"
            onBlur={(e) =>
              save("billing", { ...b, gracePeriodDays: Number(e.target.value) })
            }
          />
        </label>
        <label className="block text-sm mt-2">
          Late fee flat ($)
          <input
            type="number"
            min={0}
            defaultValue={b.lateFee?.flatAmount ?? 0}
            className="border rounded px-2 py-1 ml-2 w-24"
            onBlur={(e) =>
              save("billing", {
                ...b,
                lateFee: { ...(b.lateFee || {}), flatAmount: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="block text-sm mt-2">
          Late fee (% of rent)
          <input
            type="number"
            min={0}
            max={100}
            defaultValue={b.lateFee?.percentOfRent ?? 0}
            className="border rounded px-2 py-1 ml-2 w-24"
            onBlur={(e) =>
              save("billing", {
                ...b,
                lateFee: { ...(b.lateFee || {}), percentOfRent: Number(e.target.value) },
              })
            }
          />
        </label>
      </section>
      {saving && <p className="text-sm text-gray-500">Saving…</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add the tab to the facility detail page**

In the facility detail page found above, add a tab labeled "Settings" that renders `<FacilitySettings facilityId={facilityId} />`. Gate visibility on the user's role from the auth context in `client/src/context/`: render the tab only when role is `System_Admin` or `Company_Admin`. (Server enforcement in Task 4 is the source of truth; this is UX only.)

- [ ] **Step 3: Lint**

Run: `cd client && npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Manual verification (no client test suite)**

Start server (`cd server && npm start`) and client (`cd client && npm run dev`). As System_Admin: open a facility → Settings tab → change grace period and late fee → expect a success toast → reload and confirm values persisted. As Company_User: confirm the Settings tab is hidden and a direct `GET /facilities/:id/settings` returns 403. Record pass/fail for each check in the commit message body.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/facilityComponents/FacilitySettings.jsx <facility-detail-page-file>
git commit -m "feat: facility Settings tab (admin-only)"
```

---

## Task 9: Documentation

**Files:**
- Modify: root `CLAUDE.md`, `server/CLAUDE.md`, `README.md`

- [ ] **Step 1: Update docs**

- Root `CLAUDE.md`: under the `/facilities` routes notes, add `GET/PUT /facilities/:facilityId/settings` (admin-only via `requireFacilityAdmin`).
- `server/CLAUDE.md`: add `middleware/requireFacilityAdmin.js` to the middleware list; add a short "Facility settings" subsection describing the four groups (`billing`, `hours`, `contact`, `general`) and that PUT deep-merges via dotted `$set` so `amenities`/`unitTypes` are preserved.
- `README.md`: change the `- Facility level settings` line under "Needed features" to `- [x] Facility level settings` to match list style.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md server/CLAUDE.md README.md
git commit -m "docs: facility-level settings endpoints and middleware"
```

---

## Self-Review

**Spec coverage:**
- Billing & delinquency rules → Tasks 1, 3, 7. ✔
- Business/access hours → Task 1 (schema), Task 5 (API), Task 8 (UI). ✔
- Contact & display info → Tasks 1, 5, 8. ✔
- General prefs → Tasks 1, 5, 8. ✔
- Permissions (System_Admin + same-company Company_Admin) → Tasks 4, 6. ✔
- Dedicated sub-resource endpoints + deep-merge preserving amenities → Task 5. ✔
- One-time flat+percent late fee with idempotency → Task 7 (marker set on charge, cleared when not overdue). ✔
- `autoSuspendOnDelinquency` toggle → Task 7. ✔
- `monthly.js` unchanged behaviorally → not modified (explicitly out of scope). ✔
- Client Settings tab, admin-gated, no client tests → Task 8. ✔
- Testing matrix (schema/middleware/controller/route/delinquency) → Tasks 1, 4, 5, 6, 7. ✔

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" — all code is concrete. The only non-literal is `<facility-detail-page-file>` in Task 8, discovered via the provided grep command (the tab host file cannot be known without that lookup; this is a deliberate discovery step, not a placeholder for missing logic).

**Type consistency:** `resolveGracePeriodDays`, `computeLateFee`, `isUnitOverdue` signatures identical across Task 3 (definition) and Task 7 (use). `lateFeeAppliedAt` (Task 2) used consistently in Task 7. Settings group keys `billing|hours|contact|general` consistent across Tasks 1, 5, 8 (`GROUPS` array + `shape()`). Route path `/facilities/:facilityId/settings` consistent across Tasks 5, 6, 8.

**Spec deviations (documented in header):** payment-reset path does not exist → marker cleared in the job when not overdue; `isUnitOverdue` date fallback chain because `unit.paymentDate` is not a schema field.
