const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

////////
////////  All of these routes are prefixed with the base url /
////////  Potentially want to change these to be better defined
////////  and more descriptive
////////

// Base route: `/`
router.get("/users", authenticateAPIKey, userController.getUsers);
router.get("/profile", authenticateAPIKey, userController.getLoginData);
// router.get("/profile/compute", authenticateAPIKey, userController.processJWTData); // May not be needed
router.get(
  "/users/company/:companyId",
  authenticateAPIKey,
  userController.getUsersByCompany
); // May want to combine this into the main get users route
router.post("/users/register", authenticateAPIKey, userController.createUser); // May want to make this a post /users
router.delete("/users/delete", authenticateAPIKey, userController.deleteUser); // May want to make this a delete /users
router.put("/users/update", authenticateAPIKey, userController.editUser); // may want to make this a put /users
router.put(
  "/users/select-facility",
  authenticateAPIKey,
  userController.selectFacility
);
router.put(
  "/users/clear-facility",
  authenticateAPIKey,
  userController.clearSelectedFacility
);
router.put(
  "/users/confirm/:userId",
  authenticateAPIKey,
  userController.setUserPassword
); // May want to make this a put /users/confirm?=userId
router.get(
  "/users/confirm/:userId",
  authenticateAPIKey,
  userController.userConfirmationEmail
); // May want to make this a get /users/confirm?=userId
router.post(
  "/users/sendconfirmation",
  authenticateAPIKey,
  userController.sendUserConfirmationEmail
); // May want to make this a post /users/confirm?=userId
router.get(
  "/admin/dashboard",
  authenticateAPIKey,
  userController.getAdminDashboardData
);

// Authentication
router.post("/logout", authenticateAPIKey, userController.logoutUser); // May want to make this a post /auth/logout
router.post("/login", authenticateAPIKey, userController.loginUser); // May want to make this a post /auth/login
router.get("/users/:userId", authenticateAPIKey, userController.getUserById); // May want to combine this into the main get users route

module.exports = router;
