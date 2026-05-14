import express from "express";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import * as adminCronController from "../controllers/adminCronController.js";

const router = express.Router();

router.post("/cron/:job", authenticateAPIKey, adminCronController.runCronJob);

export default router;
