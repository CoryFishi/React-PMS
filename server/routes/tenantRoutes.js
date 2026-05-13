import express from "express";
import * as tenantController from "../controllers/tenantController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import authenticate from "../middleware/authentication.js";

const router = express.Router();

// Base route: `/tenants`
router.post("/create", authenticateAPIKey, authenticate, tenantController.createTenant);
router.get("/", authenticateAPIKey, authenticate, tenantController.getTenants);
router.get("/:tenantId", authenticateAPIKey, authenticate, tenantController.getTenantById);

router.put(
  "/update/:tenantId",
  authenticateAPIKey,
  authenticate,
  tenantController.addUnitToTenant
);

router.put("/update", authenticateAPIKey, authenticate, tenantController.editTenant);

router.delete("/delete", authenticateAPIKey, authenticate, tenantController.deleteTenant);

export default router;
