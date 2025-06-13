// Schemas
const Event = require("../models/event");
const User = require("../models/user");

//
const getApplicationEventsByFacility = async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const facilityEvents = await Event.find({
      facility: facilityId,
      eventType: "Application",
    })
      .sort({ createdAt: -1 })
      .exec();
    return res.status(200).json({ events: facilityEvents });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      res.status(409).send({ error: `${duplicateValue} is already taken!` });
    } else {
      res.status(500).send({ error: error.name });
      console.error(error);
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

const getAllEvents = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).populate("company");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = user.role === "System_Admin" || user.role === "System_User";

    let events;

    if (isAdmin) {
      events = await Event.find().sort({ createdAt: -1 }).exec();
    } else {
      if (!user.company) {
        return res
          .status(400)
          .json({ message: "No associated company found." });
      }

      events = await Event.find({ company: user.company._id })
        .sort({ createdAt: -1 })
        .exec();
    }

    return res.status(200).json({ events });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      res.status(409).send({ error: `${duplicateValue} is already taken!` });
    } else {
      res.status(500).send({ error: error.name });
      console.error(error);
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Exports
module.exports = {
  getApplicationEventsByFacility,
  getAllEvents,
};
