import { vi } from "vitest";

export function mockMailer() {
  const sendMail = vi.fn(async () => ({ messageId: "test-msg" }));
  vi.mock("nodemailer", () => ({
    default: { createTransport: vi.fn(() => ({ sendMail })) },
  }));
  return { sendMail };
}
