import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

const { accountsRetrieve, accountLinksCreate } = vi.hoisted(() => ({
  accountsRetrieve: vi.fn(),
  accountLinksCreate: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: () => ({
    accounts: {
      retrieve: accountsRetrieve,
      create: vi.fn(),
      del: vi.fn(),
      createLoginLink: vi.fn(),
    },
    accountLinks: { create: accountLinksCreate },
  }),
}));

let app, adminCookie;

beforeEach(async () => {
  accountsRetrieve.mockReset();
  accountLinksCreate.mockReset();
  process.env.FRONTEND_URL = "https://app.example.test";

  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("F-303 Stripe onboarding redirects use FRONTEND_URL", () => {
  it("derives refresh_url and return_url from process.env.FRONTEND_URL", async () => {
    const company = await makeCompany({
      stripe: { accountId: "acct_1", onboardingComplete: false },
    });
    accountsRetrieve.mockResolvedValue({
      details_submitted: false,
      charges_enabled: false,
    });
    accountLinksCreate.mockResolvedValue({
      url: "https://stripe.example/onboard",
    });

    await api(app)
      .post(`/companies/${company._id.toString()}/stripe-onboarding`)
      .set("Cookie", adminCookie);

    expect(accountLinksCreate).toHaveBeenCalled();
    const args = accountLinksCreate.mock.calls[0][0];
    expect(args.refresh_url).toContain("https://app.example.test");
    expect(args.return_url).toContain("https://app.example.test");
    expect(args.refresh_url).not.toContain("localhost:5173");
  });
});
