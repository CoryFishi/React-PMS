import crypto from "crypto";
import StorageFacility from "../models/facility.js";
import StorageUnit from "../models/unit.js";
import Rental from "../models/rental.js";
import Event from "../models/event.js";
import openTechAdapter from "./gateProviders/openTechAdapter.js";

const adapters = { opentech: openTechAdapter };

function pickAdapter(facility) {
  const key = facility?.gateProvider;
  return key ? adapters[key] : null;
}

async function logEvent(eventName, facility, message) {
  await Event.create({
    eventType: "Integration",
    eventName,
    company: facility.company?._id || facility.company,
    facility: facility._id,
    message,
  });
}

async function loadFacilityWithCompany(facilityId) {
  return StorageFacility.findById(facilityId).populate("company");
}

export async function syncFacilityResources({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const [tgs, aps] = await Promise.all([
    adapter.listTimeGroups({ facility }),
    adapter.listAccessProfiles({ facility }),
  ]);
  facility.gateProviderRefs = facility.gateProviderRefs || {};
  facility.gateProviderRefs[facility.gateProvider] =
    facility.gateProviderRefs[facility.gateProvider] || {};
  const refs = facility.gateProviderRefs[facility.gateProvider];
  refs.timeGroups = tgs;
  refs.accessProfiles = aps;
  refs.syncedAt = new Date();
  facility.markModified("gateProviderRefs");
  await facility.save();

  await logEvent(
    "Gate Sync",
    facility,
    `Synced ${tgs.length} time groups + ${aps.length} access profiles`
  );

  return { noop: false, timeGroups: tgs.length, accessProfiles: aps.length };
}

export async function setDefaults({
  facilityId,
  defaultTimeGroupId,
  defaultAccessProfileId,
}) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const refs = facility.gateProviderRefs?.[facility.gateProvider];
  if (!refs?.timeGroups?.length || !refs?.accessProfiles?.length) {
    throw new Error(
      "Time group / access profile not in synced list — run /sync first"
    );
  }
  if (!refs.timeGroups.find((g) => g.id === defaultTimeGroupId)) {
    throw new Error(
      "Time group / access profile not in synced list — run /sync first"
    );
  }
  if (!refs.accessProfiles.find((p) => p.id === defaultAccessProfileId)) {
    throw new Error(
      "Time group / access profile not in synced list — run /sync first"
    );
  }

  refs.defaultTimeGroupId = defaultTimeGroupId;
  refs.defaultAccessProfileId = defaultAccessProfileId;
  facility.markModified("gateProviderRefs");
  await facility.save();
  return { noop: false };
}

export async function getStatus({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) {
    return {
      adapterHealthy: null,
      lastSyncedAt: null,
      unprovisionedRentalCount: 0,
      provider: null,
      timeGroups: [],
      accessProfiles: [],
      defaultTimeGroupId: null,
      defaultAccessProfileId: null,
    };
  }

  const health = await adapter.healthCheck({ facility });
  const unprovisionedRentalCount = await Rental.countDocuments({
    facility: facility._id,
    signingStatus: "signed",
    $or: [
      {
        [`gateProviderRefs.${facility.gateProvider}.visitorId`]: {
          $exists: false,
        },
      },
      {
        [`gateProviderRefs.${facility.gateProvider}.visitorId`]: null,
      },
    ],
  });
  const refs = facility.gateProviderRefs?.[facility.gateProvider] || {};
  return {
    provider: facility.gateProvider,
    adapterHealthy: health.ok,
    adapterError: health.error,
    lastSyncedAt: refs.syncedAt || null,
    unprovisionedRentalCount,
    timeGroups: refs.timeGroups || [],
    accessProfiles: refs.accessProfiles || [],
    defaultTimeGroupId: refs.defaultTimeGroupId || null,
    defaultAccessProfileId: refs.defaultAccessProfileId || null,
  };
}

export async function listUnprovisioned({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  if (!facility.gateProvider) return [];

  const provider = facility.gateProvider;
  const rentals = await Rental.find({
    facility: facility._id,
    signingStatus: "signed",
    $or: [
      { [`gateProviderRefs.${provider}.visitorId`]: { $exists: false } },
      { [`gateProviderRefs.${provider}.visitorId`]: null },
      { gateProvisionError: { $exists: true, $ne: null } },
    ],
  })
    .populate("unit", "unitNumber")
    .lean();

  return rentals.map((r) => ({
    _id: r._id,
    tenantName: r.tenantName || null,
    unitNumber: r.unit?.unitNumber || null,
    gateProvisionError: r.gateProvisionError || null,
    signedAt: r.signedAt || null,
  }));
}

function generateAccessCode() {
  const len = Number(process.env.GATE_ACCESS_CODE_LENGTH || 8);
  const min = 10 ** (len - 1);
  const range = 9 * min;
  return String(min + crypto.randomInt(range));
}

export async function provisionTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId).populate("tenant");
  if (!rental) throw new Error("Rental not found");

  const facility = await loadFacilityWithCompany(rental.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const providerKey = facility.gateProvider;
  if (rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "already-provisioned" };
  }

  const unit = await StorageUnit.findById(rental.unit);
  if (!unit) throw new Error("Unit not found");
  facility.__unitRef = unit;

  let accessCode = generateAccessCode();
  let result;
  try {
    result = await adapter.provisionTenant({
      facility,
      rental,
      tenant: rental.tenant,
      accessCode,
    });
  } catch (e) {
    if (
      e.status === 400 &&
      /access.code|duplicate/i.test(e.body || e.message || "")
    ) {
      accessCode = generateAccessCode();
      result = await adapter.provisionTenant({
        facility,
        rental,
        tenant: rental.tenant,
        accessCode,
      });
    } else {
      throw e;
    }
  }

  rental.gateProviderRefs = rental.gateProviderRefs || {};
  rental.gateProviderRefs[providerKey] = {
    visitorId: result.visitorId,
    accessCode,
    provisionedAt: new Date(),
  };
  rental.gateProvisionError = undefined;
  rental.markModified("gateProviderRefs");
  await rental.save();

  await logEvent(
    "Gate Provisioned",
    facility,
    `Visitor ${result.visitorId} for rental ${rental._id}`
  );
  return { noop: false, visitorId: result.visitorId, accessCode };
}

export async function revokeTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw new Error("Rental not found");
  const facility = await loadFacilityWithCompany(rental.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  const providerKey = facility.gateProvider;
  if (!rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "no-visitor" };
  }
  const unit = await StorageUnit.findById(rental.unit);
  if (!unit) throw new Error("Unit not found");

  await adapter.revokeTenant({ facility, rental, unit });

  rental.gateProviderRefs[providerKey].visitorId = undefined;
  rental.markModified("gateProviderRefs");
  await rental.save();

  await logEvent(
    "Gate Revoked",
    facility,
    `Vacated unit ${unit._id} for rental ${rental._id}`
  );
  return { noop: false };
}

export async function suspendUnit({ unitId }) {
  const unit = await StorageUnit.findById(unitId);
  if (!unit) throw new Error("Unit not found");
  const facility = await loadFacilityWithCompany(unit.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  await adapter.suspendUnit({ facility, unit });
  await logEvent("Gate Suspended", facility, `Suspended unit ${unit._id}`);
  return { noop: false };
}

export async function unsuspendUnit({ unitId }) {
  const unit = await StorageUnit.findById(unitId);
  if (!unit) throw new Error("Unit not found");
  const facility = await loadFacilityWithCompany(unit.facility);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!adapter) return { noop: true, reason: "no-provider" };

  await adapter.unsuspendUnit({ facility, unit });
  await logEvent("Gate Unsuspended", facility, `Unsuspended unit ${unit._id}`);
  return { noop: false };
}

export async function retryProvisionTenant({ rentalId }) {
  const rental = await Rental.findById(rentalId);
  if (!rental) throw new Error("Rental not found");
  const facility = await loadFacilityWithCompany(rental.facility);
  const providerKey = facility?.gateProvider;
  if (providerKey && rental.gateProviderRefs?.[providerKey]?.visitorId) {
    return { noop: true, reason: "already-provisioned" };
  }
  return provisionTenant({ rentalId });
}
