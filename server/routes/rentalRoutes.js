const express = require("express");
const router = express.Router();
const rentalController = require("../controllers/rentalController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/rental`
// Get companies for rental checkout
router.get("/companies", authenticateAPIKey, rentalController.getCompanies);

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

module.exports = router;
