const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/companies`
router.get("/", authenticateAPIKey, companyController.getCompanies);
router.get("/:companyId", authenticateAPIKey, companyController.getCompanyById);
router.get(
  "/:companyId/facilities",
  authenticateAPIKey,
  companyController.getFacilitiesByCompany
);
router.post("/create", authenticateAPIKey, companyController.createCompany);
router.delete("/delete", authenticateAPIKey, companyController.deleteCompany);
router.put("/update", authenticateAPIKey, companyController.editCompany);

module.exports = router;
