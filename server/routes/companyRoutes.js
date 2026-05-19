import express from "express";
import * as companyController from "../controllers/companyController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import authenticate from "../middleware/authentication.js";

const router = express.Router();

// Base route: `/companies`
router.get(
  "/",
  authenticateAPIKey,
  authenticate,
  companyController.getCompanies
);

// Static-segment routes — must be registered before /:companyId to avoid
// Express matching the literal segment as a param value (F-101).
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

// Dynamic /:companyId routes
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
  companyController.syncStripeAccountRequirements
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
  "/:companyId/settings/gate",
  authenticateAPIKey,
  authenticate,
  companyController.getCompanyGateSettings
);
router.put(
  "/:companyId/settings/gate",
  authenticateAPIKey,
  authenticate,
  companyController.updateCompanyGateSettings
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

export default router;
