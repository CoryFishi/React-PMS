const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const authenticateAPIKey = require("../middleware/apiKeyAuth");

// Base route: `/events`
router.get(
  "/facilities/:facilityId/application",
  authenticateAPIKey,
  eventsController.getApplicationEventsByFacility
);
router.get("/", authenticateAPIKey, eventsController.getAllEvents);

module.exports = router;
