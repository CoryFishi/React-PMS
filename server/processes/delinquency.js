import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../models/tenant.js";
import StorageFacility from "../models/facility.js";
import Event from "../models/event.js";
import * as gateService from "../services/gateService.js";
import Rental from "../models/rental.js";
import {
  resolveGracePeriodDays,
  computeLateFee,
  isUnitOverdue,
} from "../services/billingRules.js";

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
    const now = new Date();
    const facilityCountMap = new Map();
    const facilityCache = new Map();

    const tenants = await Tenant.find({ status: "Rented" }).populate("units").lean();
    let updatedCount = 0;

    for (const tenant of tenants) {
      let hasOverdueUnit = false;

      for (const unit of tenant.units) {
        const facilityId = unit.facility?.toString();
        if (!facilityId) continue;

        let facility = facilityCache.get(facilityId);
        if (facility === undefined) {
          facility = await StorageFacility.findById(facilityId).select(
            "settings facilityName"
          );
          facilityCache.set(facilityId, facility);
        }

        const graceDays = resolveGracePeriodDays(facility);
        const overdue = isUnitOverdue(unit, graceDays, now);

        const rental = await Rental.findOne({
          unit: unit._id,
          tenant: tenant._id,
        }).sort({ createdAt: -1 });

        if (!overdue) {
          if (rental && rental.lateFeeAppliedAt) {
            rental.lateFeeAppliedAt = null;
            await rental.save();
          }
          continue;
        }

        hasOverdueUnit = true;
        facilityCountMap.set(
          facilityId,
          (facilityCountMap.get(facilityId) || 0) + 1
        );

        if (rental && !rental.lateFeeAppliedAt) {
          const fee = computeLateFee(
            facility?.settings?.billing?.lateFee,
            unit.paymentInfo?.pricePerMonth
          );
          if (fee > 0) {
            await Tenant.updateOne(
              { _id: tenant._id },
              { $inc: { balance: fee } }
            );
          }
          rental.lateFeeAppliedAt = now;
          await rental.save();
        }

        const autoSuspend =
          facility?.settings?.billing?.autoSuspendOnDelinquency !== false;
        if (autoSuspend) {
          try {
            await gateService.suspendUnit({ unitId: unit._id });
          } catch (gateErr) {
            console.error(
              `Gate suspend failed for unit ${unit._id}:`,
              gateErr.message
            );
          }
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
