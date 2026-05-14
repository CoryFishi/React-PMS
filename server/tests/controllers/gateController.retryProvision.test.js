import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

const retryMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/gateService.js", () => ({
  syncFacilityResources: vi.fn(),
  setDefaults: vi.fn(),
  getStatus: vi.fn(),
  provisionTenant: vi.fn(),
  revokeTenant: vi.fn(),
  suspendUnit: vi.fn(),
  unsuspendUnit: vi.fn(),
  retryProvisionTenant: retryMock,
}));

let app;
beforeEach(() => {
  retryMock.mockReset();
  app = buildApp();
});

describe("POST /rental/:rentalId/gate/retry", () => {
  it("200 + result on happy path", async () => {
    retryMock.mockResolvedValue({ noop: false, visitorId: "v_retry", accessCode: "12345678" });
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(200);
    expect(res.body.visitorId).toBe("v_retry");
  });

  it("404 when rental not found", async () => {
    retryMock.mockRejectedValue(new Error("Rental not found"));
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(404);
  });

  it("502 on adapter failure", async () => {
    retryMock.mockRejectedValue(new Error("OpenTech 500 boom"));
    const res = await api(app).post(`/rental/507f1f77bcf86cd799439011/gate/retry`).send();
    expect(res.status).toBe(502);
  });
});
