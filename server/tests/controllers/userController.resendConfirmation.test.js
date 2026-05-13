import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";
import User from "../../models/user.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    }),
  },
}));

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("F-205 resend confirmation does not unset confirmed on email failure", () => {
  it("keeps a confirmed user confirmed when resend email fails", async () => {
    const target = await makeUser({ role: "Company_User", confirmed: true });

    await api(app)
      .post("/users/sendconfirmation")
      .set("Cookie", adminCookie)
      .send({ userId: target._id.toString() });

    const reloaded = await User.findById(target._id);
    expect(reloaded.confirmed).toBe(true);
  });
});
