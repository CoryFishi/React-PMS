const express = require("express");
const router = express.Router();
const facilityController = require("../controllers/facilityController");
const tenantController = require("../controllers/tenantController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/facilities`
router.get(
  "/company",
  authenticateAPIKey,
  facilityController.getFacilitiesAndCompany
);
router.get(
  "/dashboard/:facilityId",
  authenticateAPIKey,
  facilityController.getFacilityDashboardData
);
router.get("/", authenticateAPIKey, facilityController.getFacilities);
router.get("/amenities", authenticateAPIKey, facilityController.getAmenities);
router.get(
  "/security",
  authenticateAPIKey,
  facilityController.getSecurityLevels
);
router.post("/create", authenticateAPIKey, facilityController.createFacility);
router.delete("/delete", authenticateAPIKey, facilityController.deleteFacility);
router.put(
  "/update/status",
  authenticateAPIKey,
  facilityController.deployFacility
);
router.put("/update", authenticateAPIKey, facilityController.editFacility);
router.post(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  facilityController.addUnitType
);
router.delete(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  facilityController.deleteUnitType
);
router.get(
  "/:facilityId/tenants/:tenantId",
  authenticateAPIKey,
  tenantController.getTenantById
);
router.get(
  "/:facilityId/tenants",
  authenticateAPIKey,
  tenantController.getTenants
);
router.put(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  facilityController.editUnitType
);
router.post(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  facilityController.addAmenity
);
router.delete(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  facilityController.deleteAmenity
);
router.put(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  facilityController.editAmenity
);

// Facility Units
router.post(
  "/:facilityId/units",
  authenticateAPIKey,
  facilityController.addUnit
);
router.delete(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  facilityController.deleteUnit
);
router.get(
  "/units/:facilityId/vacant",
  authenticateAPIKey,
  facilityController.getVacantUnits
);
router.get(
  "/:facilityId/units",
  authenticateAPIKey,
  facilityController.getUnits
);
router.put(
  "/units/:facilityId/:unitId/moveout",
  authenticateAPIKey,
  facilityController.removeTenant
);
router.put(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  facilityController.editUnit
);
router.post(
  "/:facilityId/units/:unitId/notes",
  authenticateAPIKey,
  facilityController.createNote
);
router.patch(
  "/:facilityId/units/:unitId/notes/:index",
  authenticateAPIKey,
  facilityController.editNote
);
router.get(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  facilityController.getUnitById
);
router.get(
  "/:facilityId",
  authenticateAPIKey,
  facilityController.getFacilityById
);

module.exports = router;
