import * as gateService from "../services/gateService.js";

export const syncFacility = async (req, res) => {
  try {
    const result = await gateService.syncFacilityResources({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/OpenTech (auth|credentials)/i.test(msg)) return res.status(502).json({ message: msg });
    if (/Facility not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/sync failed:", msg);
    return res.status(502).json({ message: "Gate sync failed" });
  }
};

export const setDefaults = async (req, res) => {
  try {
    const result = await gateService.setDefaults({
      facilityId: req.params.facilityId,
      defaultTimeGroupId: req.body?.defaultTimeGroupId,
      defaultAccessProfileId: req.body?.defaultAccessProfileId,
    });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/synced list/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/defaults failed:", msg);
    return res.status(500).json({ message: "Failed to update gate defaults" });
  }
};

export const getStatus = async (req, res) => {
  try {
    const result = await gateService.getStatus({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    return res.status(500).json({ message: "Failed to fetch gate status" });
  }
};

export const listUnprovisioned = async (req, res) => {
  try {
    const rentals = await gateService.listUnprovisioned({
      facilityId: req.params.facilityId,
    });
    return res.status(200).json({ rentals });
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found")
      return res.status(404).json({ message: msg });
    return res
      .status(500)
      .json({ message: "Failed to fetch unprovisioned rentals" });
  }
};

export const retryProvision = async (req, res) => {
  try {
    const result = await gateService.retryProvisionTenant({ rentalId: req.params.rentalId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Rental not found") return res.status(404).json({ message: msg });
    console.error("gate/retry failed:", msg);
    return res.status(502).json({ message: "Gate retry failed" });
  }
};
