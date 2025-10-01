import express from "express";
import * as tenantController from "../controllers/tenantController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";

const router = express.Router();

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

export default router;
