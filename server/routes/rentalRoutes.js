import express from "express";
import * as rentalController from "../controllers/rentalController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";

const router = express.Router();

// Base route: `/rental`
// Get companies for rental checkout
router.get("/companies", authenticateAPIKey, rentalController.getCompanies);

// Create a new rental
router.post(
  "/:companyId/:facilityId/:unitId/rent",
  authenticateAPIKey,
  rentalController.createTenantAndLease
);

router.post(
  "/:companyId/:facilityId/:unitId/login&rent",
  authenticateAPIKey,
  rentalController.loginTenantAndCreateLease
);

// Get company by ID and only return enabled facilities
router.get(
  "/:companyId",
  authenticateAPIKey,
  rentalController.getCompanyDataById
);

// Get facilities with lowest rates for a company
router.get(
  "/:companyId/facilities",
  authenticateAPIKey,
  rentalController.getFacilitiesLowestRate
);

// Get facility by ID and only return vacant units
router.get(
  "/:companyId/:facilityId",
  authenticateAPIKey,
  rentalController.getFacilityDataById
);

// Get unit by ID within a facility and company, returning unit details
router.get(
  "/:companyId/:facilityId/:unitId",
  authenticateAPIKey,
  rentalController.getUnitDataById
);

export default router;
