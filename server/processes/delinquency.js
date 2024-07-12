const mongoose = require("mongoose");
const Tenant = require("../models/tenant");
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
    console.log("🔴 Delinquency Script Database failed to connect", err)
  );

// Function to update tenant status
const updateTenantStatus = async () => {
  console.time("Update Tenant Status"); // Start timer
  try {
    const result = await Tenant.updateMany(
      { balance: { $gt: 0 }, status: "Rented" },
      { $set: { status: "Delinquent" } }
    );
    console.log(
      `Updated ${result.modifiedCount || 0} tenants to Delinquent status.`
    );
  } catch (error) {
    console.error("Error updating tenant status:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.timeEnd("Update Tenant Status"); // End timer
  }
};

// Run the update function
updateTenantStatus();
