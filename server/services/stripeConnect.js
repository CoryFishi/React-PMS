import Stripe from "stripe";
import Company from "../models/company.js";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

let stripeClient = null;

export const getStripeClient = () => {
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey);
  }
  return stripeClient;
};

export const assertStripeReadyForCompany = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error("Company not found");
  }
  if (!company.stripe?.accountId) {
    throw new Error("Company is not connected to Stripe");
  }
  if (!company.stripe?.onboardingComplete) {
    throw new Error("Company has not completed Stripe onboarding");
  }
  return company;
};

export const withConnectedAccount = async (companyId, callback) => {
  const company = await assertStripeReadyForCompany(companyId);
  const stripe = getStripeClient();
  return callback(stripe, company.stripe.accountId, company);
};
