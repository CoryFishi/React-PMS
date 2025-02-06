const express = require("express");
const router = express.Router();

const {
  createFacility,
  getFacilities,
  deleteFacility,
  editFacility,
  addUnits,
  deleteUnit,
  getUnits,
  getFacilitiesAndCompany,
  getAmenities,
  getSecurityLevels,
  getFacilityById,
  deployFacility,
  getVacantUnits,
  getUnitById,
  removeTenant,
  editUnit,
} = require("../controllers/facilityController");

// Facility Routes
router.get("/company", getFacilitiesAndCompany);
router.get("/", getFacilities);
router.get("/amenities", getAmenities);
router.get("/security", getSecurityLevels);
router.get("/:facilityId", getFacilityById);
router.post("/create", createFacility);
router.delete("/delete", deleteFacility);
router.put("/update/status", deployFacility);
router.put("/update", editFacility);

// Facility Units
router.post("/units/unit/create", addUnits);
router.delete("/units/unit/delete", deleteUnit);
router.get("/units/:facilityId/vacant", getVacantUnits);
router.get("/units/:facilityId", getUnits);
router.put("/units/:facilityId/:unitId/moveout", removeTenant);
router.put("/units/unit/update", editUnit);
router.get("/units/unit/:unitId", getUnitById);

module.exports = router;
