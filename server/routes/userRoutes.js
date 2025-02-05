const express = require("express");
const router = express.Router();

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

// User Routes
router.get("/users", getUsers);
router.get("/profile", getLoginData);
router.get("/profile/compute", processJWTData);
router.get("/users/company/:companyId", getUsersByCompany);
router.post("/users/register", createUser);
router.delete("/users/delete", deleteUser);
router.put("/users/update", editUser);
router.put("/confirm/:userId", setUserPassword);
router.get("/confirm/:userId", userConfirmationEmail);
router.post("/sendconfirmation", sendUserConfirmationEmail);

// Authentication
router.post("/login", loginUser);
router.get("/users/:userId", getUserById);

module.exports = router;
