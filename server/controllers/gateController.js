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
    return res.status(502).json({ message: `Gate sync failed: ${msg}` });
  }
};

export const getUnitSyncStatus = async (req, res) => {
  try {
    const result = await gateService.checkUnitSync({ facilityId: req.params.facilityId });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/units/status failed:", msg);
    return res.status(502).json({ message: `Unit sync status failed: ${msg}` });
  }
};

export const syncUnits = async (req, res) => {
  try {
    const result = await gateService.syncUnits({
      facilityId: req.params.facilityId,
      force: req.body?.force === true,
    });
    if (result?.blocked) return res.status(409).json(result);
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found") return res.status(404).json({ message: msg });
    if (/not linked to OpenTech/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/units/sync failed:", msg);
    return res.status(502).json({ message: `Unit sync failed: ${msg}` });
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

export const linkFacility = async (req, res) => {
  try {
    const result = await gateService.linkFacility({
      facilityId: req.params.facilityId,
      opentechFacilityId: req.body?.opentechFacilityId,
    });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found")
      return res.status(404).json({ message: msg });
    if (/required/i.test(msg)) return res.status(400).json({ message: msg });
    console.error("gate/link failed:", msg);
    return res.status(500).json({ message: "Failed to link facility" });
  }
};

export const unlinkFacility = async (req, res) => {
  try {
    const result = await gateService.unlinkFacility({
      facilityId: req.params.facilityId,
    });
    return res.status(200).json(result);
  } catch (e) {
    const msg = e?.message || "Unknown error";
    if (msg === "Facility not found")
      return res.status(404).json({ message: msg });
    console.error("gate/unlink failed:", msg);
    return res.status(500).json({ message: "Failed to unlink facility" });
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
