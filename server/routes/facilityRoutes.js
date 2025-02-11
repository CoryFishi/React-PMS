const express = require("express");
const router = express.Router();
const facilityController = require("../controllers/facilityController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/facilities`
router.get(
  "/company",
  authenticateAPIKey,
  facilityController.getFacilitiesAndCompany
);
router.get("/", authenticateAPIKey, facilityController.getFacilities);
router.get("/amenities", authenticateAPIKey, facilityController.getAmenities);
router.get(
  "/security",
  authenticateAPIKey,
  facilityController.getSecurityLevels
);
router.get(
  "/:facilityId",
  authenticateAPIKey,
  facilityController.getFacilityById
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
  "/units/unit/create",
  authenticateAPIKey,
  facilityController.addUnits
);
router.delete(
  "/units/unit/delete",
  authenticateAPIKey,
  facilityController.deleteUnit
);
router.get(
  "/units/:facilityId/vacant",
  authenticateAPIKey,
  facilityController.getVacantUnits
);
router.get(
  "/units/:facilityId",
  authenticateAPIKey,
  facilityController.getUnits
);
router.put(
  "/units/:facilityId/:unitId/moveout",
  authenticateAPIKey,
  facilityController.removeTenant
);
router.put(
  "/units/unit/update",
  authenticateAPIKey,
  facilityController.editUnit
);
router.get(
  "/units/unit/:unitId",
  authenticateAPIKey,
  facilityController.getUnitById
);

module.exports = router;
