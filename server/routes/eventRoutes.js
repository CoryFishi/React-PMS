const express = require("express");
const router = express.Router();

const {
  getApplicationEventsByFacility,
  getAllEvents,
} = require("../controllers/eventsController");

// Events Routes
router.get(
  "/facilities/:facilityId/application",
  getApplicationEventsByFacility
);
router.get("/", getAllEvents);

module.exports = router;
