import { vi } from "vitest";

export function mockStripe(overrides = {}) {
  const defaultImpl = {
    accounts: {
      create: vi.fn(async () => ({ id: "acct_test" })),
      retrieve: vi.fn(async () => ({ id: "acct_test", charges_enabled: true, payouts_enabled: true, requirements: { currently_due: [] } })),
    },
    accountLinks: {
      create: vi.fn(async () => ({ url: "https://stripe.example/onboarding" })),
    },
    accountSessions: {
      create: vi.fn(async () => ({ client_secret: "cs_test" })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ id: "cs_test", url: "https://stripe.example/checkout" })),
      },
    },
    paymentIntents: {
      create: vi.fn(async () => ({ id: "pi_test", client_secret: "pi_test_secret" })),
    },
    ...overrides,
  };
  vi.mock("stripe", () => ({
    default: vi.fn(() => defaultImpl),
  }));
  return defaultImpl;
}
