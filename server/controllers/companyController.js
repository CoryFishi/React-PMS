import User from "../models/user.js";
import StorageUnit from "../models/unit.js";
import StorageFacility from "../models/facility.js";
import Company from "../models/company.js";
import Stripe from "stripe";
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const unixToDate = (timestamp) =>
  typeof timestamp === "number" ? new Date(timestamp * 1000) : undefined;

export const createCompany = async (req, res) => {
  try {
    // 1. Create the Stripe Connected Account
    const stripeAccount = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: req.body.contactInfo?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 2. Add stripe data to the company body
    const companyWithStripe = {
      ...req.body,
      stripe: {
        accountId: stripeAccount.id,
        onboardingComplete: false,
      },
    };

    // 3. Create the company in MongoDB
    const newCompany = await Company.create(companyWithStripe);
    res.status(201).json(newCompany);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      res.status(409).send({ error: `${duplicateValue} is already taken!` });
    } else {
      console.error("Rejecting due to unknown error: " + error.name);
      res.status(500).send({ error: error.name });
    }
  }
};

export const getStripeDashboardLink = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, company } = user;
    const companyId = req.params.companyId;

    const isSystem = role === "System_Admin" || role === "System_User";
    const isCompanyAdmin = role === "Company_Admin";

    if (!isSystem && !(isCompanyAdmin && company?.toString() === companyId)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const companyData = await Company.findById(companyId);
    const accountId = companyData?.stripe?.accountId;

    if (!accountId) {
      return res.status(404).json({ message: "Stripe account not found" });
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);

    res.status(200).json({ url: loginLink.url });
  } catch (err) {
    console.error("Error generating Stripe login link:", err);
    res.status(500).json({ message: "Failed to generate login link" });
  }
};

export const createStripeAccountLink = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company || !company.stripe?.accountId) {
      return res
        .status(404)
        .json({ error: "Company or Stripe account not found" });
    }

    // Check Stripe account status
    const account = await stripe.accounts.retrieve(company.stripe.accountId);

    // If onboarding is complete, update the company and return it
    if (account.details_submitted && account.charges_enabled) {
      company.stripe.onboardingComplete = true;
      await company.save();
      return res.status(200).json({ company });
    }

    // Otherwise, generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: company.stripe.accountId,
      refresh_url: "http://localhost:5173/dashboard/companies",
      return_url: "http://localhost:5173/dashboard/companies",
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe account onboarding error:", error);
    res.status(500).json({ error: "Failed to create account link" });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, company: userCompanyId } = user;
    const { companyId } = req.params;

    const isSystem = role === "System_Admin" || role === "System_User";
    const isCompanyAdmin = role === "Company_Admin";

    if (
      !isSystem &&
      !(isCompanyAdmin && userCompanyId?.toString() === companyId)
    ) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const stripeAccountId = company.stripe?.accountId;
    if (!stripeAccountId) {
      return res
        .status(409)
        .json({ message: "Company is not connected to Stripe" });
    }

    const {
      unitId,
      successUrl,
      cancelUrl,
      metadata: metadataPayload,
    } = req.body;

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    const unit = await StorageUnit.findById(unitId).populate("facility");

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const facility = unit.facility;

    if (!facility) {
      return res
        .status(409)
        .json({ message: "Unit is missing facility association" });
    }

    if (facility.company?.toString() !== companyId) {
      return res
        .status(403)
        .json({ message: "Unit does not belong to this company" });
    }

    const unitStripe = unit.stripe || {};
    const priceId = unitStripe.priceId;

    if (!priceId) {
      return res
        .status(409)
        .json({ message: "Unit is not configured with a Stripe price" });
    }

    const checkoutSuccessUrl =
      typeof successUrl === "string" ? successUrl : req.body.url;
    const checkoutCancelUrl =
      typeof cancelUrl === "string" ? cancelUrl : req.body.url;

    if (!checkoutSuccessUrl || !checkoutCancelUrl) {
      return res
        .status(400)
        .json({ message: "Both successUrl and cancelUrl are required" });
    }

    const metadata = {
      companyId: companyId.toString(),
      facilityId: facility._id.toString(),
      unitId: unit._id.toString(),
      ...(metadataPayload && typeof metadataPayload === "object"
        ? Object.fromEntries(
            Object.entries(metadataPayload).filter(
              ([, value]) => value !== undefined && value !== null
            )
          )
        : {}),
    };

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: checkoutSuccessUrl,
        cancel_url: checkoutCancelUrl,
        metadata,
      },
      {
        stripeAccount: unitStripe.accountId || stripeAccountId,
      }
    );

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);
    return res
      .status(500)
      .json({ message: "Failed to create Stripe Checkout session" });
  }
};

// Get Company by ID
export const getCompanyStripeSettings = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, company } = user;

    const isSystem = role === "System_Admin" || role === "System_User";
    const isCompanyAdmin = role === "Company_Admin";

    if (!isSystem && !(isCompanyAdmin && company?.toString() === companyId)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const companyData = await Company.findById(companyId);
    if (!companyData) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json(companyData.stripe);
  } catch (error) {
    console.error(
      "Error processing the last get company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get all companies
export const getCompanies = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let companies;
    if (user.role === "System_Admin" || user.role === "System_User") {
      companies = await Company.find({}).sort({ companyName: 1 });
    } else {
      companies = await Company.find({ _id: user.company });
    }

    return res.status(200).json(companies);
  } catch (error) {
    console.error("Error processing the getCompanies call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};

// Get Company by ID
export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    res.status(200).json(company);
  } catch (error) {
    console.error(
      "Error processing the last get company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get all facilities apart of a company
export const getFacilitiesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const facilities = await StorageFacility.find({
      company: companyId,
    }).populate("units");
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching facilities", error });
  }
};

// Update a company by ID
export const editCompany = async (req, res) => {
  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      req.query.companyId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCompany) {
      console.error("Rejecting edit company due to no company found!");
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(updatedCompany);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      res.status(409).send({ error: `${duplicateValue} is already taken!` });
    } else {
      res.status(500).send({ error: error.name });
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Delete a company by ID
export const deleteCompany = async (req, res) => {
  try {
    const companyId = req.query.id;
    const company = await Company.findById(companyId);
    if (!company) {
      console.error("Rejecting delete company due to no facility found!");
      return res.status(404).json({ message: "Company not found!" });
    }
    if (company.facilities.length > 0) {
      console.error(
        "Rejecting delete company due the company having active facilities!"
      );
      return res
        .status(400)
        .json({ message: "Cannot delete company with associated facilities!" });
    }
    await Company.findByIdAndDelete(companyId);
    const deleteUsersWithCompany = await User.deleteMany({
      company: companyId,
    });

    res.status(200).json({ message: `${companyId} deleted successfully!` });
  } catch (error) {
    console.error(
      "Error processing the last delete company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

export const syncStripeAccountRequirements = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, company } = user;
    const companyId = req.params.companyId;

    const isSystem = role === "System_Admin" || role === "System_User";
    const isCompanyAdmin = role === "Company_Admin";

    if (!isSystem && !(isCompanyAdmin && company?.toString() === companyId)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const companyData = await Company.findById(companyId);
    if (!companyData || !companyData.stripe?.accountId) {
      return res.status(404).json({ message: "Stripe account not found" });
    }

    const account = await stripe.accounts.retrieve(
      companyData.stripe.accountId
    );

    const requirements = account.requirements ?? {};
    const futureRequirements = account.future_requirements ?? {};

    companyData.stripe.requirements = {
      currentlyDue: requirements.currently_due ?? [],
      eventuallyDue: requirements.eventually_due ?? [],
      pastDue: requirements.past_due ?? [],
      pendingVerification: requirements.pending_verification ?? [],
      currentDeadline: unixToDate(requirements.current_deadline),
      disabledReason: requirements.disabled_reason ?? null,
    };

    companyData.stripe.futureRequirements = {
      currentlyDue: futureRequirements.currently_due ?? [],
      eventuallyDue: futureRequirements.eventually_due ?? [],
      pastDue: futureRequirements.past_due ?? [],
      pendingVerification: futureRequirements.pending_verification ?? [],
      currentDeadline: unixToDate(futureRequirements.current_deadline),
    };

    const onboardingComplete =
      account.details_submitted && account.charges_enabled;

    companyData.stripe.onboardingComplete = onboardingComplete;
    companyData.stripe.lastRequirementsSync = new Date();

    await companyData.save();

    return res.status(200).json({
      onboardingComplete,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: companyData.stripe.requirements,
      futureRequirements: companyData.stripe.futureRequirements,
      lastRequirementsSync: companyData.stripe.lastRequirementsSync,
    });
  } catch (err) {
    console.error("Stripe requirements sync error:", err);
    return res
      .status(500)
      .json({ message: "Error retrieving Stripe account requirements" });
  }
};
