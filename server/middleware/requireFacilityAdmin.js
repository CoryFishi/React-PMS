// server/middleware/requireFacilityAdmin.js
import User from "../models/user.js";
import StorageFacility from "../models/facility.js";

const requireFacilityAdmin = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(userId).select("role company");
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    if (user.role === "System_Admin") return next();

    if (user.role === "Company_Admin") {
      const facility = await StorageFacility.findById(req.params.facilityId).select("company");
      if (!facility) return res.status(404).json({ message: "Facility not found" });
      if (user.company && facility.company?.toString() === user.company.toString()) {
        return next();
      }
    }

    return res.status(403).json({ message: "Forbidden: facility admin access required" });
  } catch (err) {
    console.error("requireFacilityAdmin error:", err);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export default requireFacilityAdmin;
