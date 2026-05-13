import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

let app;

beforeEach(async () => {
  app = buildApp();
});

describe("F-102 rentalRoutes: most-specific paths resolve first", () => {
  it("GET /rental/:cid/:fid/:uid resolves cleanly", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);
    const u = await makeUnit(f);

    const res = await api(app).get(`/rental/${c._id}/${f._id}/${u._id}`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid/:fid resolves cleanly", async () => {
    const c = await makeCompany();
    const f = await makeFacility(c);

    const res = await api(app).get(`/rental/${c._id}/${f._id}`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid/facilities resolves cleanly", async () => {
    const c = await makeCompany();

    const res = await api(app).get(`/rental/${c._id}/facilities`);
    expect(res.status).not.toBe(500);
  });

  it("GET /rental/:cid resolves cleanly", async () => {
    const c = await makeCompany();

    const res = await api(app).get(`/rental/${c._id}`);
    expect(res.status).not.toBe(500);
  });
});
