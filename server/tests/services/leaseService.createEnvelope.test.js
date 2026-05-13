import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeCompany, makeFacility, makeUnit, makeTenant } from "../helpers/factories.js";
import Rental from "../../models/rental.js";

const envelopesCreate = vi.fn();
const recipientViewCreate = vi.fn();

vi.mock("../../services/docusignClient.js", () => ({
  default: async () => ({
    envelopesApi: {
      createEnvelope: envelopesCreate,
      createRecipientView: recipientViewCreate,
    },
    accountId: "acct_test",
  }),
}));

import { createEnvelope } from "../../services/leaseService.js";

beforeEach(() => {
  envelopesCreate.mockReset();
  recipientViewCreate.mockReset();
  process.env.DS_LEASE_TEMPLATE_ID = "tpl_test_lease";
  process.env.FRONTEND_URL = "https://app.example.test";
});

async function seedPaidRental(overrides = {}) {
  const company = await makeCompany();
  const facility = await makeFacility(company, { facilityName: "Sunny Self Storage" });
  const unit = await makeUnit(facility, { unitNumber: "U-42" });
  const tenant = await makeTenant({
    company: company._id,
    firstName: "Pat",
    lastName: "Renter",
    contactInfo: { email: "pat@example.com" },
  });
  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    amount: 150,
    status: "paid",
    signingStatus: "unsent",
    ...overrides,
  });
  return { rental, tenant };
}

describe("leaseService.createEnvelope", () => {
  it("rejects with 'Payment not complete' if Rental.status is not paid", async () => {
    const { rental } = await seedPaidRental({ status: "pending" });
    await expect(createEnvelope({ rentalId: rental._id })).rejects.toThrow(/payment not complete/i);
    expect(envelopesCreate).not.toHaveBeenCalled();
  });

  it("creates envelope with template + tab labels, persists envelopeId and signingStatus", async () => {
    envelopesCreate.mockResolvedValue({ envelopeId: "env_xyz" });
    recipientViewCreate.mockResolvedValue({ url: "https://docusign.example/sign/abc" });

    const { rental, tenant } = await seedPaidRental();

    const result = await createEnvelope({ rentalId: rental._id });

    expect(result.envelopeId).toBe("env_xyz");
    expect(result.signingUrl).toBe("https://docusign.example/sign/abc");

    expect(envelopesCreate).toHaveBeenCalledTimes(1);
    const [accountId, opts] = envelopesCreate.mock.calls[0];
    expect(accountId).toBe("acct_test");
    expect(opts.envelopeDefinition.templateId).toBe("tpl_test_lease");
    expect(opts.envelopeDefinition.status).toBe("sent");
    const role = opts.envelopeDefinition.templateRoles[0];
    expect(role.roleName).toBe("tenant");
    expect(role.email).toBe("pat@example.com");
    expect(role.clientUserId).toBe(tenant._id.toString());
    const textTabLabels = role.tabs.textTabs.map((t) => t.tabLabel);
    expect(textTabLabels).toEqual(
      expect.arrayContaining([
        "tenantName",
        "tenantEmail",
        "unitNumber",
        "facilityName",
        "monthlyPrice",
        "startDate",
      ])
    );

    const refreshed = await Rental.findById(rental._id);
    expect(refreshed.envelopeId).toBe("env_xyz");
    expect(refreshed.signingStatus).toBe("sent");
  });

  it("is idempotent — re-use existing envelope, return fresh signing URL", async () => {
    recipientViewCreate.mockResolvedValue({ url: "https://docusign.example/sign/fresh" });

    const { rental } = await seedPaidRental({
      envelopeId: "env_existing",
      signingStatus: "sent",
    });

    const result = await createEnvelope({ rentalId: rental._id });

    expect(result.envelopeId).toBe("env_existing");
    expect(result.signingUrl).toBe("https://docusign.example/sign/fresh");
    expect(envelopesCreate).not.toHaveBeenCalled();
    expect(recipientViewCreate).toHaveBeenCalledTimes(1);
  });

  it("throws if DS_LEASE_TEMPLATE_ID is unset", async () => {
    delete process.env.DS_LEASE_TEMPLATE_ID;
    const { rental } = await seedPaidRental();
    await expect(createEnvelope({ rentalId: rental._id })).rejects.toThrow(/DS_LEASE_TEMPLATE_ID/);
  });
});
