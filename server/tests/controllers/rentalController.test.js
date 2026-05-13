import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { makeCompany, makeFacility, makeUnit } from "../helpers/factories.js";

let app;
beforeEach(() => {
  app = buildApp();
});

describe("POST /rental/:cid/:fid/:uid/login&rent — F-001 regression", () => {
  it("does not crash with ReferenceError; returns a stable 501 Not Implemented", async () => {
    const company = await makeCompany();
    const facility = await makeFacility(company);
    const unit = await makeUnit(facility);

    // Express registers the route with a literal '&' in the path segment.
    // Supertest/node http treats '&' in a path as a literal character (not
    // a query-string separator) when the path is passed directly, so we use
    // the raw string rather than the percent-encoded form.
    const res = await api(app)
      .post(`/rental/${company._id}/${facility._id}/${unit._id}/login&rent`)
      .send({ username: "test@example.com", password: "Wrong!" });

    expect(res.status).toBe(501);
    expect(res.body).toBeTruthy();
    // The response body should explain the endpoint is not yet implemented
    expect(JSON.stringify(res.body)).toMatch(/not.*implemented|unavailable/i);
  });
});
