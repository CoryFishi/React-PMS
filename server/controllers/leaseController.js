import * as leaseService from "../services/leaseService.js";

export const createLeaseEnvelope = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const result = await leaseService.createEnvelope({ rentalId });
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Unknown error";
    if (msg === "Rental not found") {
      return res.status(404).json({ message: msg });
    }
    if (msg === "Payment not complete") {
      return res.status(409).json({ message: msg });
    }
    if (msg === "DS_LEASE_TEMPLATE_ID is not configured") {
      console.error("DS_LEASE_TEMPLATE_ID is not configured");
      return res.status(500).json({ message: "Lease template not configured" });
    }
    console.error("createLeaseEnvelope failed:", msg);
    return res.status(502).json({ message: "Failed to create lease envelope" });
  }
};

export const streamSignedPdf = async (req, res) => {
  try {
    const { rentalId } = req.params;
    await leaseService.streamSignedPdf({ rentalId, res });
  } catch (error) {
    const msg = error?.message || "Unknown error";
    if (msg === "Rental not found") return res.status(404).json({ message: msg });
    if (msg === "Lease not signed") return res.status(409).json({ message: msg });
    console.error("streamSignedPdf failed:", msg);
    return res.status(502).json({ message: "Failed to fetch signed PDF" });
  }
};
