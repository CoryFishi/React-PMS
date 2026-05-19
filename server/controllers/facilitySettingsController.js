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

function validateBilling(billing) {
  if (billing === undefined) return null;
  if (billing.lateFee !== undefined) {
    const pct = billing.lateFee.percentOfRent;
    if (pct !== undefined && (typeof pct !== "number" || pct < 0 || pct > 100)) {
      return "lateFee.percentOfRent must be between 0 and 100";
    }
    const flat = billing.lateFee.flatAmount;
    if (flat !== undefined && (typeof flat !== "number" || flat < 0)) {
      return "lateFee.flatAmount must be >= 0";
    }
  }
  if (billing.gracePeriodDays !== undefined) {
    if (typeof billing.gracePeriodDays !== "number" || billing.gracePeriodDays < 0) {
      return "gracePeriodDays must be >= 0";
    }
  }
  return null;
}

export const updateFacilitySettings = async (req, res) => {
  try {
    const facility = await StorageFacility.findById(req.params.facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    // Validate billing group before persisting
    const billingErr = validateBilling(req.body.billing);
    if (billingErr) return res.status(400).json({ message: billingErr });

    // Build dotted $set paths so only provided fields are written and amenities/unitTypes survive
    const update = {};
    for (const g of GROUPS) {
      if (req.body[g] !== undefined) {
        const group = req.body[g];
        if (g === "billing") {
          // Flatten one more level to avoid overwriting sibling billing fields
          if (group.gracePeriodDays !== undefined) update["settings.billing.gracePeriodDays"] = group.gracePeriodDays;
          if (group.autoSuspendOnDelinquency !== undefined) update["settings.billing.autoSuspendOnDelinquency"] = group.autoSuspendOnDelinquency;
          if (group.lateFee !== undefined) {
            if (group.lateFee.flatAmount !== undefined) update["settings.billing.lateFee.flatAmount"] = group.lateFee.flatAmount;
            if (group.lateFee.percentOfRent !== undefined) update["settings.billing.lateFee.percentOfRent"] = group.lateFee.percentOfRent;
          }
        } else {
          update[`settings.${g}`] = group;
        }
      }
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No valid settings groups provided" });
    }

    const updated = await StorageFacility.findByIdAndUpdate(
      req.params.facilityId,
      { $set: update },
      { new: true }
    ).select("settings facilityName");

    await Event.create({
      eventType: "Application",
      eventName: "Facility Updated",
      message: `${facility.facilityName} settings updated`,
      facility: facility._id,
    });

    return res.json(shape(updated.settings));
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("updateFacilitySettings error:", err);
    return res.status(500).json({ message: "Failed to update facility settings" });
  }
};
