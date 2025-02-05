const express = require("express");
const router = express.Router();

const {
  createCompany,
  getCompanies,
  deleteCompany,
  editCompany,
  getFacilitiesByCompany,
  getCompanyById,
} = require("../controllers/companyController");

// Base route: `/companies`
router.get("/", getCompanies);
router.get("/:companyId", getCompanyById);
router.get("/:companyId/facilities", getFacilitiesByCompany);
router.post("/create", createCompany);
router.delete("/delete", deleteCompany);
router.put("/update", editCompany);

module.exports = router;
