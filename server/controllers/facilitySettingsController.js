// server/controllers/facilitySettingsController.js
import StorageFacility from "../models/facility.js";
import Event from "../models/event.js";

const GROUPS = ["billing", "hours", "contact", "general"];

function shape(settings) {
  const s = settings || {};
  return {
    billing: s.billing ?? {},
    hours: s.hours ?? { office: [], gateAccess: [] },
    contact: s.contact ?? {},
    general: s.general ?? {},
  };
}

export const getFacilitySettings = async (req, res) => {
  try {
    const facility = await StorageFacility.findById(req.params.facilityId).select("settings");
    if (!facility) return res.status(404).json({ message: "Facility not found" });
    return res.json(shape(facility.settings));
  } catch (err) {
    console.error("getFacilitySettings error:", err);
    return res.status(500).json({ message: "Failed to load facility settings" });
  }
};

export const updateFacilitySettings = async (req, res) => {
  try {
    const facility = await StorageFacility.findById(req.params.facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    const provided = GROUPS.filter((g) => req.body[g] !== undefined);
    if (provided.length === 0) {
      return res.status(400).json({ message: "No valid settings groups provided" });
    }

    for (const g of provided) {
      facility.set(`settings.${g}`, req.body[g]);
    }

    await facility.save(); // runs full schema validation; untouched groups & amenities/unitTypes preserved

    await Event.create({
      eventType: "Application",
      eventName: "Facility Updated",
      message: `${facility.facilityName} settings updated`,
      facility: facility._id,
    });

    return res.json(shape(facility.settings));
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("updateFacilitySettings error:", err);
    return res.status(500).json({ message: "Failed to update facility settings" });
  }
};
