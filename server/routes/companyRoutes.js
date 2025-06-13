const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");
const { authenticate } = require("../middleware/authentication");

// Base route: `/companies`
router.get(
  "/",
  authenticateAPIKey,
  authenticate,
  companyController.getCompanies
);
router.post(
  "/:companyId/stripe-onboarding",
  authenticateAPIKey,
  authenticate,
  companyController.createStripeAccountLink
);
router.get(
  "/:companyId/stripe-onboarding-status",
  authenticateAPIKey,
  authenticate,
  companyController.checkStripeOnboardingStatus
);
router.get(
  "/:companyId/stripe-dashboard-link",
  authenticateAPIKey,
  authenticate,
  companyController.getStripeDashboardLink
);
router.get(
  "/:companyId/settings/stripe",
  authenticateAPIKey,
  authenticate,
  companyController.getCompanyStripeSettings
);
router.get(
  "/:companyId",
  authenticateAPIKey,
  authenticate,
  companyController.getCompanyById
);
router.get(
  "/:companyId/facilities",
  authenticateAPIKey,
  authenticate,
  companyController.getFacilitiesByCompany
);
router.post(
  "/:companyId/checkout-session",
  authenticateAPIKey,
  authenticate,
  companyController.createCheckoutSession
);
router.post(
  "/create",
  authenticateAPIKey,
  authenticate,
  companyController.createCompany
);
router.delete(
  "/delete",
  authenticateAPIKey,
  authenticate,
  companyController.deleteCompany
);
router.put(
  "/update",
  authenticateAPIKey,
  authenticate,
  companyController.editCompany
);

module.exports = router;
