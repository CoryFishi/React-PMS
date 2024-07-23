const mongoose = require("mongoose");
const Tenant = require("../models/tenant");
const StorageUnit = require("../models/unit");
const StorageFacility = require("../models/facility");
const Event = require("../models/event");
const dotenv = require("dotenv").config();

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

// Connect to the database
mongoose
  .connect(process.env.MONGO_URL, connectionOptions)
  .catch((err) =>
    console.log("🔴 Monthly Script Database failed to connect", err)
  );

// Function to update tenant balance
const updateTenantBalance = async () => {
  console.time("Update Tenant Balance"); // Start timer
  var count = 0;
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
          totalAdditionalBalance += storageUnit.pricePerMonth;
          const facilityIdStr = storageUnit.facility.toString();
          facilityCountMap.set(
            facilityIdStr,
            (facilityCountMap.get(facilityIdStr) || 0) + 1
          );
        }
      }

      await Tenant.updateOne(
        { _id: tenant._id },
        { $inc: { balance: totalAdditionalBalance } }
      );
      count++;
    }
    console.log(`${count} tenants balance increased`);
    for (const [facilityIdStr, count] of facilityCountMap) {
      const facilityId = new mongoose.Types.ObjectId(facilityIdStr);
      const facility = await StorageFacility.findById(facilityId);
      if (facility) {
        await Event.create({
          eventType: "Application",
          eventName: "Facility Balancer",
          message: `${facility.facilityName} updated ${count} tenant's balances`,
          facility: facilityId,
        });
      }
    }
  } catch (error) {
    console.error("Error updating tenant balance:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.timeEnd("Update Tenant Balance"); // End timer
  }
};

// Run the update function
updateTenantBalance();
