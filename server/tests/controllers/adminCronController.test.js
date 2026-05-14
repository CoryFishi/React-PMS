import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";

const updateTenantStatusMock = vi.hoisted(() => vi.fn());
const updateTenantBalanceMock = vi.hoisted(() => vi.fn());
const runOrphanCleanupMock = vi.hoisted(() => vi.fn());

vi.mock("../../processes/delinquency.js", () => ({
  updateTenantStatus: updateTenantStatusMock,
}));
vi.mock("../../processes/monthly.js", () => ({
  updateTenantBalance: updateTenantBalanceMock,
}));
vi.mock("../../processes/orphanCleanup.js", () => ({
  runOrphanCleanup: runOrphanCleanupMock,
}));

let app;
beforeEach(() => {
  updateTenantStatusMock.mockReset();
  updateTenantBalanceMock.mockReset();
  runOrphanCleanupMock.mockReset();
  app = buildApp();
});

describe("POST /admin/cron/:job", () => {
  it("returns 401 without API key", async () => {
    const res = await request(app).post("/admin/cron/delinquency").send();
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown job", async () => {
    const res = await api(app).post("/admin/cron/bogus").send();
    expect(res.status).toBe(404);
  });

  it("invokes delinquency and returns { ok, job, durationMs, result }", async () => {
    updateTenantStatusMock.mockResolvedValue({ updated: 3 });

    const res = await api(app).post("/admin/cron/delinquency").send();

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.job).toBe("delinquency");
    expect(typeof res.body.durationMs).toBe("number");
    expect(res.body.result).toEqual({ updated: 3 });
    expect(updateTenantStatusMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("invokes monthly", async () => {
    updateTenantBalanceMock.mockResolvedValue({ touched: 5 });

    const res = await api(app).post("/admin/cron/monthly").send();

    expect(res.status).toBe(200);
    expect(res.body.job).toBe("monthly");
    expect(updateTenantBalanceMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("invokes orphan-cleanup", async () => {
    runOrphanCleanupMock.mockResolvedValue({ deleted: 1, ageDays: 7 });

    const res = await api(app).post("/admin/cron/orphan-cleanup").send();

    expect(res.status).toBe(200);
    expect(res.body.job).toBe("orphan-cleanup");
    expect(runOrphanCleanupMock).toHaveBeenCalledWith({ disconnect: false });
  });

  it("returns 500 with { ok: false, error } when the job throws", async () => {
    updateTenantStatusMock.mockRejectedValue(new Error("DB blew up"));

    const res = await api(app).post("/admin/cron/delinquency").send();

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/DB blew up/);
  });
});
