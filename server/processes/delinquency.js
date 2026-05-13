import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/tenant.js";
import StorageFacility from "../models/facility.js";
import Event from "../models/event.js";

dotenv.config();

// Increase the default timeout settings
const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout for initial connection
  socketTimeoutMS: 45000, // 45 seconds timeout for operations
};

////////////////////////////////////////
// Need to rewrite so it looks for last payment date
// So everyone is not billed across the software
////////////////////////////////////////

export const updateTenantStatus = async ({ disconnect = true } = {}) => {
  console.time("Update Tenant Status");
  try {
    const oneWeekAgo = new Date();
    const facilityCountMap = new Map();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const tenants = await Tenant.find({ status: "Rented" }).populate("units");

    let updatedCount = 0;

    for (const tenant of tenants) {
      let hasOverdueUnit = false;

      for (const unit of tenant.units) {
        if (new Date(unit.paymentDate) < oneWeekAgo) {
          hasOverdueUnit = true;
          const facilityIdStr = unit.facility.toString();
          facilityCountMap.set(
            facilityIdStr,
            (facilityCountMap.get(facilityIdStr) || 0) + 1
          );

          break;
        }
      }

      if (hasOverdueUnit) {
        await Tenant.updateOne(
          { _id: tenant._id },
          { $set: { status: "Delinquent" } }
        );
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} tenants to Delinquent status.`);
    for (const [facilityIdStr, count] of facilityCountMap) {
      const facilityId = new mongoose.Types.ObjectId(facilityIdStr);
      const facility = await StorageFacility.findById(facilityId);
      if (facility) {
        await Event.create({
          eventType: "Application",
          eventName: "Facility Delinquency",
          message: `${facility.facilityName} updated ${count} to delinquent`,
          facility: facilityId,
        });
      }
    }
  } catch (error) {
    console.error("Error updating tenant status:", error);
  } finally {
    if (disconnect) {
      await mongoose.connection.close();
    }
    console.timeEnd("Update Tenant Status");
  }
};

const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(
    (process.argv[1] || "").replace(/\\/g, "/")
  );

if (invokedAsScript) {
  mongoose
    .connect(process.env.MONGO_URL, connectionOptions)
    .then(() => updateTenantStatus({ disconnect: true }))
    .catch((err) =>
      console.log("🔴 Delinquency Script Database failed to connect", err)
    );
}
