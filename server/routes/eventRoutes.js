import express from "express";
import * as eventsController from "../controllers/eventsController.js";
import authenticateAPIKey from "../middleware/apiKeyAuth.js";
import authenticate from "../middleware/authentication.js";

const router = express.Router();

// Base route: `/events`
router.get(
  "/facilities/:facilityId/application",
  authenticateAPIKey,
  authenticate,
  eventsController.getApplicationEventsByFacility
);
router.get(
  "/",
  authenticateAPIKey,
  authenticate,
  eventsController.getAllEvents
);

export default router;
