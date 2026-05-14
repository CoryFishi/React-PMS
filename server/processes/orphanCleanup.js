import mongoose from "mongoose";
import dotenv from "dotenv";

import Tenant from "../models/tenant.js";
import Rental from "../models/rental.js";

dotenv.config();

// Increase the default timeout settings
const connectionOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};

// Exported so tests (and other callers) can invoke without triggering the
// connect/disconnect lifecycle.
export const runOrphanCleanup = async ({ disconnect = true } = {}) => {
  const ageDays = Number(process.env.ORPHAN_TENANT_AGE_DAYS || 7);
  const cutoff = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);

  const candidates = await Tenant.find({ status: "New", createdAt: { $lt: cutoff } });

  let deleted = 0;
  for (const tenant of candidates) {
    const paid = await Rental.findOne({ tenant: tenant._id, status: "paid" });
    if (paid) continue;
    await Rental.deleteMany({ tenant: tenant._id });
    await Tenant.deleteOne({ _id: tenant._id });
    deleted += 1;
  }

  console.log(`orphanCleanup: deleted ${deleted} orphan tenants older than ${ageDays} days`);

  if (disconnect) {
    await mongoose.disconnect();
  }

  return { deleted, ageDays };
};

// Allow running this file directly: `node server/processes/orphanCleanup.js`
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith((process.argv[1] || "").replace(/\\/g, "/"));

if (invokedAsScript) {
  mongoose
    .connect(process.env.MONGO_URL, connectionOptions)
    .then(() => runOrphanCleanup({ disconnect: true }))
    .catch((err) => {
      console.error("orphanCleanup failed:", err);
      process.exit(1);
    });
}
