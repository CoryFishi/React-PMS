// Schemas
const Company = require("../models/company");
const StorageFacility = require("../models/facility");
const User = require("../models/user");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCompany = async (req, res) => {
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

const checkStripeOnboardingStatus = async (req, res) => {
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

    const isComplete = account.details_submitted && account.charges_enabled;

    if (isComplete && !companyData.stripe.onboardingComplete) {
      companyData.stripe.onboardingComplete = true;
      await companyData.save();
    }

    res.status(200).json({ isComplete });
  } catch (err) {
    console.error("Stripe onboarding check error:", err);
    res.status(500).json({ message: "Error checking onboarding status" });
  }
};

const getStripeDashboardLink = async (req, res) => {
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

const createStripeAccountLink = async (req, res) => {
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
      refresh_url: "http://localhost:5173/dashboard/admin/companies",
      return_url: "http://localhost:5173/dashboard/admin/companies",
      type: "account_onboarding",
    });

    res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe account onboarding error:", error);
    res.status(500).json({ error: "Failed to create account link" });
  }
};

const createCheckoutSession = async (req, res) => {
  const { priceInCents, companyStripeAccountId, url } = req.body;

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Storage Unit Rent",
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: url,
      cancel_url: url,
    },
    {
      stripeAccount: companyStripeAccountId,
    }
  );

  res.json({ url: session.url });
};

// Get Company by ID
const getCompanyStripeSettings = async (req, res) => {
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
const getCompanies = async (req, res) => {
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
const getCompanyById = async (req, res) => {
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
const getFacilitiesByCompany = async (req, res) => {
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
const editCompany = async (req, res) => {
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
const deleteCompany = async (req, res) => {
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

module.exports = {
  createCompany,
  editCompany,
  getCompanies,
  deleteCompany,
  getFacilitiesByCompany,
  getCompanyById,
  createStripeAccountLink,
  createCheckoutSession,
  getCompanyStripeSettings,
  checkStripeOnboardingStatus,
  getStripeDashboardLink,
};
