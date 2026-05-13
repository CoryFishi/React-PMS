import { vi } from "vitest";

export function mockDocusign() {
  vi.mock("../../services/docusignClient.js", () => ({
    default: vi.fn(async () => ({
      accountId: "test-account",
      envelopesApi: {
        createEnvelope: vi.fn(async () => ({ envelopeId: "env-123", status: "sent" })),
        getEnvelope: vi.fn(async () => ({ envelopeId: "env-123", status: "completed" })),
      },
    })),
  }));
}
