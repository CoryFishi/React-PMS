import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, oid } from "../helpers/factories.js";
import User from "../../models/user.js";
import StorageFacility from "../../models/facility.js";

let app, adminCookie, admin;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("DELETE /users/delete — F-005 regression", () => {
  it("does NOT call StorageFacility.updateMany when user is not found (F-005)", async () => {
    const updateManySpy = vi.spyOn(StorageFacility, "updateMany");
    const fakeId = oid();
    const res = await api(app)
      .delete("/users/delete")
      .set("Cookie", adminCookie)
      .query({ userId: fakeId });
    expect(res.status).toBe(404);
    expect(updateManySpy).not.toHaveBeenCalled();
    updateManySpy.mockRestore();
  });

  it("calls StorageFacility.updateMany when user IS deleted (F-005)", async () => {
    const updateManySpy = vi.spyOn(StorageFacility, "updateMany");
    const victim = await makeUser({ role: "Company_User" });
    const res = await api(app)
      .delete("/users/delete")
      .set("Cookie", adminCookie)
      .query({ userId: victim._id.toString() });
    expect(res.status).toBe(200);
    expect(updateManySpy).toHaveBeenCalled();
    updateManySpy.mockRestore();
  });

  it("actually removes the user from the database on success", async () => {
    const victim = await makeUser({ role: "Company_User" });
    const res = await api(app)
      .delete("/users/delete")
      .set("Cookie", adminCookie)
      .query({ userId: victim._id.toString() });
    expect(res.status).toBe(200);
    const stillThere = await User.findById(victim._id);
    expect(stillThere).toBeNull();
  });
});
