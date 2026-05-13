import Rental from "../models/rental.js";
import { getStripeClient, assertStripeReadyForCompany } from "./stripeConnect.js";
import getEnvelopesApi from "./docusignClient.js";

const sanitizeMetadata = (meta) =>
  Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, v === undefined || v === null ? "" : String(v)])
  );

export async function startRental({
  company,
  facility,
  unit,
  tenant,
  successUrl,
  cancelUrl,
}) {
  if (!unit?.stripe?.priceId) {
    throw new Error("Unit is not configured with a Stripe price");
  }
  if (!successUrl || !cancelUrl) {
    throw new Error("successUrl and cancelUrl are required");
  }

  const stripe = getStripeClient();
  const verifiedCompany = await assertStripeReadyForCompany(company._id);
  const stripeAccountId = unit.stripe.accountId || verifiedCompany.stripe?.accountId;
  const priceId = unit.stripe.priceId;

  const price = await stripe.prices.retrieve(priceId, {
    stripeAccount: stripeAccountId,
    expand: ["product"],
  });
  if (!price || price.active === false) {
    throw new Error("Unit's Stripe price is inactive");
  }

  const isRecurring = price.type === "recurring";
  const checkoutMode = isRecurring ? "subscription" : "payment";

  const metadata = sanitizeMetadata({
    companyId: company._id.toString(),
    facilityId: facility._id.toString(),
    unitId: unit._id.toString(),
    tenantId: tenant._id.toString(),
  });

  const sessionPayload = {
    mode: checkoutMode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    customer_email: tenant.contactInfo?.email || undefined,
    metadata,
  };

  if (checkoutMode === "payment") {
    sessionPayload.payment_intent_data = { metadata };
  } else {
    sessionPayload.subscription_data = { metadata };
  }

  const session = await stripe.checkout.sessions.create(sessionPayload, {
    stripeAccount: stripeAccountId,
  });

  const priceAmount =
    typeof price.unit_amount === "number"
      ? price.unit_amount / 100
      : unit.paymentInfo?.pricePerMonth;

  const rental = await Rental.create({
    company: company._id,
    facility: facility._id,
    unit: unit._id,
    tenant: tenant._id,
    tenantEmail: tenant.contactInfo?.email || undefined,
    tenantName: [tenant.firstName, tenant.lastName].filter(Boolean).join(" ") || undefined,
    amount: priceAmount,
    currency: price.currency || "usd",
    checkoutSessionId: session.id,
    stripeAccountId,
    stripePriceId: priceId,
    status: "pending",
    signingStatus: "unsent",
    metadata,
  });

  return { checkoutUrl: session.url, rentalId: rental._id.toString() };
}

export async function createEnvelope({ rentalId }) {
  const templateId = process.env.DS_LEASE_TEMPLATE_ID;
  if (!templateId) {
    throw new Error("DS_LEASE_TEMPLATE_ID is not configured");
  }

  const rental = await Rental.findById(rentalId)
    .populate("tenant")
    .populate("unit")
    .populate("facility");

  if (!rental) {
    throw new Error("Rental not found");
  }
  if (rental.status !== "paid") {
    throw new Error("Payment not complete");
  }

  const { envelopesApi, accountId } = await getEnvelopesApi();
  const returnUrl = `${process.env.FRONTEND_URL || ""}/rental/${rental._id}/signed`;

  let envelopeId = rental.envelopeId;
  if (!envelopeId || rental.signingStatus === "unsent") {
    const tenant = rental.tenant;
    const unit = rental.unit;
    const facility = rental.facility;

    const tenantName = [tenant?.firstName, tenant?.lastName].filter(Boolean).join(" ");
    const tenantEmail = tenant?.contactInfo?.email;
    const monthlyPrice =
      typeof rental.amount === "number" ? rental.amount.toFixed(2) : "";
    const startDate = new Date().toISOString().slice(0, 10);

    const envelopeDefinition = {
      templateId,
      status: "sent",
      templateRoles: [
        {
          roleName: "tenant",
          name: tenantName,
          email: tenantEmail,
          clientUserId: tenant._id.toString(),
          tabs: {
            textTabs: [
              { tabLabel: "tenantName", value: tenantName },
              { tabLabel: "tenantEmail", value: tenantEmail || "" },
              { tabLabel: "unitNumber", value: unit?.unitNumber || "" },
              { tabLabel: "facilityName", value: facility?.facilityName || "" },
              { tabLabel: "monthlyPrice", value: monthlyPrice },
              { tabLabel: "startDate", value: startDate },
            ],
          },
        },
      ],
    };

    const created = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    envelopeId = created.envelopeId;
    rental.envelopeId = envelopeId;
    rental.signingStatus = "sent";
    await rental.save();
  }

  const tenantId = rental.tenant._id.toString();
  const recipientViewRequest = {
    returnUrl,
    authenticationMethod: "none",
    email: rental.tenant?.contactInfo?.email,
    userName: [rental.tenant?.firstName, rental.tenant?.lastName].filter(Boolean).join(" "),
    clientUserId: tenantId,
  };

  const view = await envelopesApi.createRecipientView(accountId, envelopeId, {
    recipientViewRequest,
  });

  return { envelopeId, signingUrl: view.url };
}
