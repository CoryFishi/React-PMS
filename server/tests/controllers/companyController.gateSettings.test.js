import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../app.js";
import { api } from "../helpers/request.js";
import { cookieFor } from "../helpers/auth.js";
import { makeUser, makeCompany } from "../helpers/factories.js";

let app, adminCookie;

beforeEach(async () => {
  app = buildApp();
  const admin = await makeUser({ role: "System_Admin" });
  adminCookie = cookieFor({ id: admin._id.toString(), role: admin.role });
});

describe("Company gate credentials settings", () => {
  it("GET never returns the apiSecret, only apiKey + apiSecretSet flag", async () => {
    const company = await makeCompany({
      gateProviders: { opentech: { apiKey: "key_1", apiSecret: "secret_1" } },
    });

    const res = await api(app)
      .get(`/companies/${company._id}/settings/gate`)
      .set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.opentech.apiKey).toBe("key_1");
    expect(res.body.opentech.apiSecretSet).toBe(true);
    expect(res.body.opentech.apiSecret).toBeUndefined();
  });

  it("PUT stores credentials and reports apiSecretSet without echoing the secret", async () => {
    const company = await makeCompany();

    const res = await api(app)
      .put(`/companies/${company._id}/settings/gate`)
      .set("Cookie", adminCookie)
      .send({ opentech: { apiKey: "key_2", apiSecret: "secret_2" } });

    expect(res.status).toBe(200);
    expect(res.body.opentech.apiKey).toBe("key_2");
    expect(res.body.opentech.apiSecretSet).toBe(true);
    expect(res.body.opentech.apiSecret).toBeUndefined();
  });

  it("PUT without apiSecret preserves the existing stored secret", async () => {
    const company = await makeCompany({
      gateProviders: { opentech: { apiKey: "old", apiSecret: "keepme" } },
    });

    const res = await api(app)
      .put(`/companies/${company._id}/settings/gate`)
      .set("Cookie", adminCookie)
      .send({ opentech: { apiKey: "new" } });

    expect(res.status).toBe(200);
    expect(res.body.opentech.apiKey).toBe("new");
    expect(res.body.opentech.apiSecretSet).toBe(true);
  });

  it("forbids a Company_Admin from another company", async () => {
    const target = await makeCompany();
    const other = await makeCompany();
    const ca = await makeUser({
      role: "Company_Admin",
      company: other._id,
    });
    const caCookie = cookieFor({ id: ca._id.toString(), role: ca.role });

    const res = await api(app)
      .get(`/companies/${target._id}/settings/gate`)
      .set("Cookie", caCookie);

    expect(res.status).toBe(403);
  });
});
