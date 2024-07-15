const mongoose = require("mongoose");
const Tenant = require("../models/tenant");
const StorageUnit = require("../models/unit");
const dotenv = require("dotenv").config();

// Increase the default timeout settings
const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout for initial connection
  socketTimeoutMS: 45000, // 45 seconds timeout for operations
};

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
        }
      }

      await Tenant.updateOne(
        { _id: tenant._id },
        { $inc: { balance: totalAdditionalBalance } }
      );
      count++;
    }
    console.log(`${count} tenants balance increased`);
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
