import Rental from "../models/rental.js";
import { getStripeClient, assertStripeReadyForCompany } from "./stripeConnect.js";

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
