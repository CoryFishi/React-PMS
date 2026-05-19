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

function normUnitKey(s) {
  return String(s ?? "").trim().toLowerCase();
}

async function diffUnits(facility, adapter) {
  const otUnits = await adapter.listUnits({ facility });
  const ourUnits = await StorageUnit.find({ facility: facility._id });
  const otByKey = new Map(otUnits.map((u) => [normUnitKey(u.unitNumber), u]));
  const ourByKey = new Map(ourUnits.map((u) => [normUnitKey(u.unitNumber), u]));
  const missing = ourUnits.filter((u) => !otByKey.has(normUnitKey(u.unitNumber)));
  const extra = otUnits.filter((u) => !ourByKey.has(normUnitKey(u.unitNumber)));
  const matched = ourUnits.filter((u) => otByKey.has(normUnitKey(u.unitNumber)));
  return { otUnits, ourUnits, otByKey, missing, extra, matched };
}

function persistUnitSync(facility, patch) {
  const provider = facility.gateProvider;
  facility.gateProviderRefs = facility.gateProviderRefs || {};
  facility.gateProviderRefs[provider] = facility.gateProviderRefs[provider] || {};
  facility.gateProviderRefs[provider].unitSync = {
    ...(facility.gateProviderRefs[provider].unitSync || {}),
    ...patch,
  };
  facility.markModified("gateProviderRefs");
}

export async function checkUnitSync({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!facility.gateProvider || !adapter) throw new Error("Facility not linked to OpenTech");

  const { missing, extra, matched } = await diffUnits(facility, adapter);
  const status = missing.length === 0 && extra.length === 0 ? "in-sync" : "out-of-sync";
  persistUnitSync(facility, {
    status,
    lastCheckedAt: new Date(),
    missing: missing.length,
    extra: extra.length,
    matched: matched.length,
  });
  await facility.save();
  return {
    status,
    missing: missing.map((u) => u.unitNumber),
    extra: extra.map((u) => u.unitNumber),
    matched: matched.length,
  };
}

function setUnitRemoteId(unit, provider, id) {
  unit.gateProviderRefs = unit.gateProviderRefs || {};
  unit.gateProviderRefs[provider] = unit.gateProviderRefs[provider] || {};
  unit.gateProviderRefs[provider].unitId = String(id);
  unit.markModified("gateProviderRefs");
}

export async function syncUnits({ facilityId, force = false }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");
  const adapter = pickAdapter(facility);
  if (!facility.gateProvider || !adapter) throw new Error("Facility not linked to OpenTech");
  const provider = facility.gateProvider;

  const { otUnits, ourUnits, otByKey, missing, extra, matched } = await diffUnits(facility, adapter);

  // Safety guard
  const zeroOurs = ourUnits.length === 0;
  const overDeleteRatio = otUnits.length > 0 && extra.length / otUnits.length > 0.2;
  if (!force && (zeroOurs || overDeleteRatio)) {
    return { blocked: true, wouldCreate: missing.length, wouldDelete: extra.length };
  }

  const errors = [];
  let created = 0;
  let deleted = 0;

  for (const u of missing) {
    try {
      const { id } = await adapter.createUnit({ facility, unitNumber: u.unitNumber });
      setUnitRemoteId(u, provider, id);
      await u.save();
      await logEvent("Gate Unit Created", facility, `Unit ${u.unitNumber} -> OpenTech ${id}`);
      created += 1;
    } catch (e) {
      errors.push({ unitNumber: u.unitNumber, op: "create", message: e.message });
    }
  }

  for (const ot of extra) {
    try {
      await adapter.vacateUnit({ facility, unitId: ot.id });
      await adapter.deleteVacantUnit({ facility, unitId: ot.id });
      await logEvent("Gate Unit Deleted", facility, `Vacated+deleted OpenTech unit ${ot.unitNumber} (${ot.id})`);
      deleted += 1;
    } catch (e) {
      errors.push({ unitNumber: ot.unitNumber, op: "delete", message: e.message });
    }
  }

  for (const u of matched) {
    const ot = otByKey.get(normUnitKey(u.unitNumber));
    if (ot && u.gateProviderRefs?.[provider]?.unitId !== String(ot.id)) {
      setUnitRemoteId(u, provider, ot.id);
      await u.save();
    }
  }

  const status =
    errors.length === 0 && missing.length === created && extra.length === deleted
      ? "in-sync"
      : "out-of-sync";

  persistUnitSync(facility, {
    status,
    lastSyncAt: new Date(),
    lastCheckedAt: new Date(),
    created,
    deleted,
    matched: matched.length,
    missing: missing.length - created,
    extra: extra.length - deleted,
    errors,
  });
  await facility.save();
  await logEvent(
    "Gate Unit Sync",
    facility,
    `created ${created}, deleted ${deleted}, matched ${matched.length}, errors ${errors.length}`
  );

  return { status, created, deleted, matched: matched.length, errors };
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

export async function linkFacility({ facilityId, opentechFacilityId }) {
  const id = typeof opentechFacilityId === "string" ? opentechFacilityId.trim() : "";
  if (!id) throw new Error("opentechFacilityId is required");
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");

  facility.gateProvider = "opentech";
  facility.gateProviderRefs = facility.gateProviderRefs || {};
  facility.gateProviderRefs.opentech = facility.gateProviderRefs.opentech || {};
  facility.gateProviderRefs.opentech.facilityId = id;
  facility.markModified("gateProviderRefs");
  await facility.save();
  return { provider: "opentech", facilityId: id };
}

export async function unlinkFacility({ facilityId }) {
  const facility = await loadFacilityWithCompany(facilityId);
  if (!facility) throw new Error("Facility not found");

  facility.gateProvider = undefined;
  facility.markModified("gateProvider");
  await facility.save();
  return { provider: null };
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
