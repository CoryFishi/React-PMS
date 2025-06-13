const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");
const { authenticate } = require("../middleware/authentication");
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

module.exports = router;
