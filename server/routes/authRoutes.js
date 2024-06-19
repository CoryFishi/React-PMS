const express = require("express");
const router = express.Router();
const cors = require("cors");

const { test } = require("../controllers/testController");

const {
  createUser,
  getUsers,
  deleteUser,
  editUser,
  userConfirmationEmail,
  getLoginData,
  loginUser,
  processJWTData,
  sendUserConfirmationEmail,
  getUserById,
  setUserPassword,
  getUsersByCompany,
} = require("../controllers/userController");

const {
  createFacility,
  getFacilities,
  deleteFacility,
  editFacility,
  addUnits,
  deleteUnit,
  getUnits,
  editUnit,
  getFacilitiesAndCompany,
  getAmenities,
  getSecurityLevels,
  getFacilityById,
  deployFacility,
  getUnitById,
} = require("../controllers/facilityController");

const {
  createCompany,
  getCompanies,
  deleteCompany,
  editCompany,
  getFacilitiesByCompany,
  getCompanyById,
} = require("../controllers/companyController");

const {
  createTenant,
  getTenants,
  editTenant,
  deleteTenant,
} = require("../controllers/tenantController");

// middleware
router.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

// /
router.get("/", test);

// /users
router.get("/users", getUsers);
router.get("/users/:userId", getUserById);
router.get("/users/company/:companyId", getUsersByCompany);
router.post("/users/register", createUser);
router.delete("/users/delete", deleteUser);
router.put("/users/update", editUser);
router.put("/users/confirm/:userId", setUserPassword);
router.get("/users/confirm/:userId", userConfirmationEmail);
router.post("/login", loginUser);
router.get("/profile", getLoginData);
router.get("/profile/compute", processJWTData);
router.post("/users/sendconfirmation", sendUserConfirmationEmail);

// /companies
router.get("/companies", getCompanies);
router.get("/companies/:companyId", getCompanyById);
router.get("/companies/:companyId/facilities", getFacilitiesByCompany);
router.post("/companies/create", createCompany);
router.delete("/companies/delete", deleteCompany);
router.put("/companies/update", editCompany);

// /facilities
router.get("/facilities&company", getFacilitiesAndCompany);
router.get("/facilities", getFacilities);
router.get("/facilities/amenities", getAmenities);
router.get("/facilities/security", getSecurityLevels);
router.get("/facilities/:facilityId", getFacilityById);
router.post("/facilities/create", createFacility);
router.delete("/facilities/delete", deleteFacility);
router.put("/facilities/update/status", deployFacility);
router.put("/facilities/update", editFacility);

// /facilities/units
router.post("/facilities/units/create", addUnits);
router.delete("/facilities/units/delete", deleteUnit);
router.get("/facilities/units/:facilityId", getUnits);
router.put("/facilities/units/update", editUnit); 
router.get("/units/:unitId", getUnitById);

// /tenants
router.post("/tenants/create", createTenant);
router.get("/tenants", getTenants);
router.put("/tenants/update", editTenant);
router.delete("/tenants/delete", deleteTenant);

module.exports = router;
