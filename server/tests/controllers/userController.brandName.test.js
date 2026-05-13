import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

const sendMail = vi.fn().mockResolvedValue({ messageId: "ok" });
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

let app, adminCookie;

beforeEach(async () => {
  sendMail.mockClear();
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-302 confirmation emails do not reference SafePhish", () => {
  it("createUser email body does not contain 'SafePhish'", async () => {
    const admin = await makeUser({ role: "System_Admin" });

    await api(app)
      .post("/users/register")
      .set("Cookie", adminCookie)
      .send({
        name: "Brand Test",
        displayName: "brand",
        email: `brand-${Date.now()}@example.com`,
        role: "System_User",
        address: { street1: "1 A", city: "B", state: "TX", zipCode: "00000", country: "US" },
        createdBy: admin._id.toString(),
      });

    expect(sendMail).toHaveBeenCalled();
    const mailArg = sendMail.mock.calls[0][0];
    const blob = JSON.stringify(mailArg);
    expect(blob).not.toMatch(/SafePhish/i);
  });
});
