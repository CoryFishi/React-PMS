import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/tenant.js";
import StorageUnit from "../models/unit.js";
import StorageFacility from "../models/facility.js";
import Event from "../models/event.js";

dotenv.config();

// Increase the default timeout settings
const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout for initial connection
  socketTimeoutMS: 45000, // 45 seconds timeout for operations
};

//////////////////////////////////////////////
// Need to create logic with new Unit payment date schedule
// This will allow for people to rent multiple units but not be designated to pay all of it at once
// For example if I rented one 2 days ago but my other rental is due in 2 days, I dont have to pay both
//////////////////////////////////////////////

// Update tenant balances. Exported so tests (and other callers) can invoke
// without triggering the connect/disconnect lifecycle.
export const updateTenantBalance = async ({ disconnect = true } = {}) => {
  console.time("Update Tenant Balance");
  let count = 0;
  const facilityCountMap = new Map();

  try {
    const tenants = await Tenant.find({
      status: { $in: ["Rented", "Delinquent"] },
    });

    for (const tenant of tenants) {
      let totalAdditionalBalance = 0;

      for (const unitId of tenant.units) {
        const storageUnit = await StorageUnit.findById(unitId);

        if (storageUnit) {
          totalAdditionalBalance += storageUnit.paymentInfo?.pricePerMonth ?? 0;
          const facilityIdStr = storageUnit.facility.toString();
          facilityCountMap.set(
            facilityIdStr,
            (facilityCountMap.get(facilityIdStr) || 0) + 1
          );
        }
      }

      await Tenant.updateOne(
        { _id: tenant._id },
        { $inc: { balance: totalAdditionalBalance } },
        { strict: false }
      );
      count++;
    }
    console.log(`${count} tenants balance increased`);
    for (const [facilityIdStr, fcount] of facilityCountMap) {
      const facilityId = new mongoose.Types.ObjectId(facilityIdStr);
      const facility = await StorageFacility.findById(facilityId);
      if (facility) {
        await Event.create({
          eventType: "Application",
          eventName: "Facility Balancer",
          message: `${facility.facilityName} updated ${fcount} tenant's balances`,
          facility: facilityId,
        });
      }
    }
  } catch (error) {
    console.error("Error updating tenant balance:", error);
  } finally {
    if (disconnect) {
      await mongoose.connection.close();
    }
    console.timeEnd("Update Tenant Balance");
  }
};

// When invoked directly as a script (node server/processes/monthly.js),
// connect to Mongo, run the job, then disconnect.
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(
    (process.argv[1] || "").replace(/\\/g, "/")
  );

if (invokedAsScript) {
  mongoose
    .connect(process.env.MONGO_URL, connectionOptions)
    .then(() => updateTenantBalance({ disconnect: true }))
    .catch((err) =>
      console.log("🔴 Monthly Script Database failed to connect", err)
    );
}
