const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/tenants`
router.post("/create", authenticateAPIKey, tenantController.createTenant);
router.get("/", authenticateAPIKey, tenantController.getTenants);
router.get("/:tenantId", authenticateAPIKey, tenantController.getTenantById);
router.put(
  "/update/:tenantId",
  authenticateAPIKey,
  tenantController.addUnitToTenant
);
router.put("/update", authenticateAPIKey, tenantController.editTenant);
router.delete("/delete", authenticateAPIKey, tenantController.deleteTenant);

module.exports = router;
