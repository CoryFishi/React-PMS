const express = require("express");
const router = express.Router();

const {
  createTenant,
  getTenants,
  editTenant,
  deleteTenant,
  addUnitToTenant,
  getTenantById,
} = require("../controllers/tenantController");

// Tenant Routes
router.post("/create", createTenant);
router.get("/", getTenants);
router.get("/:tenantId", getTenantById);
router.put("/update/:tenantId", addUnitToTenant);
router.put("/update", editTenant);
router.delete("/delete", deleteTenant);

module.exports = router;
