const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");
const { authenticate } = require("../middleware/authentication");
////////
////////  All of these routes are prefixed with the base url /
////////  Potentially want to change these to be better defined
////////  and more descriptive
////////

// Base route: `/`
router.get("/users", authenticateAPIKey, authenticate, userController.getUsers);
router.get(
  "/profile",
  authenticateAPIKey,
  authenticate,
  userController.getLoginData
);
// router.get("/profile/compute", authenticateAPIKey, userController.processJWTData); // May not be needed
router.get(
  "/users/company/:companyId",
  authenticateAPIKey,
  authenticate,
  userController.getUsersByCompany
); // May want to combine this into the main get users route
router.post(
  "/users/register",
  authenticateAPIKey,
  authenticate,
  userController.createUser
); // May want to make this a post /users
router.delete(
  "/users/delete",
  authenticateAPIKey,
  authenticate,
  userController.deleteUser
); // May want to make this a delete /users
router.put(
  "/users/update",
  authenticateAPIKey,
  authenticate,
  userController.editUser
); // may want to make this a put /users
router.put(
  "/users/select-facility",
  authenticateAPIKey,
  authenticate,
  userController.selectFacility
);
router.put(
  "/users/clear-facility",
  authenticateAPIKey,
  authenticate,
  userController.clearSelectedFacility
);
router.put(
  "/users/confirm/:userId",
  authenticateAPIKey,
  authenticate,
  userController.setUserPassword
); // May want to make this a put /users/confirm?=userId
router.get(
  "/users/confirm/:userId",
  authenticateAPIKey,
  authenticate,
  userController.userConfirmationEmail
); // May want to make this a get /users/confirm?=userId
router.post(
  "/users/sendconfirmation",
  authenticateAPIKey,
  authenticate,
  userController.sendUserConfirmationEmail
); // May want to make this a post /users/confirm?=userId
router.get(
  "/dashboard/overview",
  authenticateAPIKey,
  authenticate,
  userController.getDashboardData
);

// Authentication
router.post(
  "/logout",
  authenticateAPIKey,
  authenticate,
  userController.logoutUser
); // May want to make this a post /auth/logout
router.post(
  "/login",
  authenticateAPIKey,
  authenticate,
  userController.loginUser
); // May want to make this a post /auth/login
router.get(
  "/users/:userId",
  authenticateAPIKey,
  authenticate,
  userController.getUserById
); // May want to combine this into the main get users route

router.get(
  "/rental/:companyId",
  authenticateAPIKey,
  authenticate,
  userController.rentalCenterCompany
);
router.get(
  "/rental/:companyId/facilities",
  authenticateAPIKey,
  authenticate,
  userController.rentalCenterFacilities
);
router.get(
  "/rental/:companyId/:facilityId/units",
  authenticateAPIKey,
  authenticate,
  userController.rentalCenterUnits
);
router.get(
  "/rental/:companyId/:facilityId/:unitId",
  authenticateAPIKey,
  authenticate,
  userController.rentalCenterConfig
);

module.exports = router;
