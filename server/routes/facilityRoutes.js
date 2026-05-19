import express from "express";
import * as facilityController from "../controllers/facilityController.js";
import * as tenantController from "../controllers/tenantController.js";
import * as gateController from "../controllers/gateController.js";
import * as facilitySettingsController from "../controllers/facilitySettingsController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import authenticate from "../middleware/authentication.js";
import requireFacilityAdmin from "../middleware/requireFacilityAdmin.js";

const router = express.Router();

// Base route: `/facilities`
router.get(
  "/company",
  authenticateAPIKey,
  authenticate,
  facilityController.getFacilitiesAndCompany
);
router.get(
  "/dashboard/:facilityId",
  authenticateAPIKey,
  authenticate,
  facilityController.getFacilityDashboardData
);
router.get(
  "/",
  authenticateAPIKey,
  authenticate,
  facilityController.getFacilities
);
router.get(
  "/amenities",
  authenticateAPIKey,
  authenticate,
  facilityController.getAmenities
);
router.get(
  "/security",
  authenticateAPIKey,
  authenticate,
  facilityController.getSecurityLevels
);
router.post(
  "/create",
  authenticateAPIKey,
  authenticate,
  facilityController.createFacility
);
router.delete(
  "/delete",
  authenticateAPIKey,
  authenticate,
  facilityController.deleteFacility
);
router.put(
  "/update/status",
  authenticateAPIKey,
  authenticate,
  facilityController.deployFacility
);
router.put(
  "/update",
  authenticateAPIKey,
  authenticate,
  facilityController.editFacility
);
router.post(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  authenticate,
  facilityController.addUnitType
);
router.delete(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  authenticate,
  facilityController.deleteUnitType
);
router.get(
  "/:facilityId/tenants/:tenantId",
  authenticateAPIKey,
  authenticate,
  tenantController.getTenantById
);
router.post(
  "/:facilityId/tenants",
  authenticateAPIKey,
  authenticate,
  tenantController.createTenant
);

router.put(
  "/:facilityId/tenants/:tenantId",
  authenticateAPIKey,
  authenticate,
  tenantController.editTenant
);
router.get(
  "/:facilityId/tenants",
  authenticateAPIKey,
  authenticate,
  tenantController.getTenants
);
router.put(
  "/:facilityId/settings/unittypes",
  authenticateAPIKey,
  authenticate,
  facilityController.editUnitType
);
router.post(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  authenticate,
  facilityController.addAmenity
);
router.delete(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  authenticate,
  facilityController.deleteAmenity
);
router.put(
  "/:facilityId/settings/amenities",
  authenticateAPIKey,
  authenticate,
  facilityController.editAmenity
);

// Facility Units
router.post(
  "/:facilityId/units",
  authenticateAPIKey,
  authenticate,
  facilityController.addUnit
);
router.delete(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  authenticate,
  facilityController.deleteUnit
);
router.get(
  "/units/:facilityId/vacant",
  authenticateAPIKey,
  authenticate,
  facilityController.getVacantUnits
);
router.get(
  "/:facilityId/units",
  authenticateAPIKey,
  authenticate,
  facilityController.getUnits
);
router.put(
  "/:facilityId/units/:unitId/moveout",
  authenticateAPIKey,
  authenticate,
  facilityController.removeTenant
);
router.put(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  authenticate,
  facilityController.editUnit
);
router.post(
  "/:facilityId/units/:unitId/notes",
  authenticateAPIKey,
  authenticate,
  facilityController.createNote
);
router.patch(
  "/:facilityId/units/:unitId/notes/:index",
  authenticateAPIKey,
  authenticate,
  facilityController.editNote
);
router.get(
  "/:facilityId/units/:unitId",
  authenticateAPIKey,
  authenticate,
  facilityController.getUnitById
);
router.post("/:facilityId/gate/sync", authenticateAPIKey, authenticate, gateController.syncFacility);
router.put("/:facilityId/gate/defaults", authenticateAPIKey, authenticate, gateController.setDefaults);
router.get("/:facilityId/gate/status", authenticateAPIKey, authenticate, gateController.getStatus);

router.get(
  "/:facilityId/settings",
  authenticateAPIKey,
  authenticate,
  requireFacilityAdmin,
  facilitySettingsController.getFacilitySettings
);
router.put(
  "/:facilityId/settings",
  authenticateAPIKey,
  authenticate,
  requireFacilityAdmin,
  facilitySettingsController.updateFacilitySettings
);

router.get(
  "/:facilityId",
  authenticateAPIKey,
  authenticate,
  facilityController.getFacilityById
);

export default router;
