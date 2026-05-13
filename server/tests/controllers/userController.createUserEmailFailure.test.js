import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser } from "../helpers/factories.js";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockRejectedValue(new Error("SMTP down")),
    }),
  },
}));

let app, adminCookie, admin, errorSpy;

beforeEach(async () => {
  app = buildApp();
  admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /users/register — F-204 await sendMail", () => {
  it("returns 201 even when the confirmation email fails to send", async () => {
    const res = await api(app)
      .post("/users/register")
      .set("Cookie", adminCookie)
      .send({
        name: "New Person",
        displayName: `np${Date.now()}`.slice(0, 20),
        email: `new-${Date.now()}@example.com`,
        role: "System_Admin",
        address: {
          street1: "1 A St",
          city: "B",
          state: "TX",
          zipCode: "00000",
          country: "US",
        },
        createdBy: admin._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(errorSpy).toHaveBeenCalled();
  });
});
