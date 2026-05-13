import mongoose from "mongoose";
import User from "../../models/user.js";
import Company from "../../models/company.js";
import Facility from "../../models/facility.js";
import StorageUnit from "../../models/unit.js";
import Tenant from "../../models/tenant.js";
import Rental from "../../models/rental.js";
import Payment from "../../models/payment.js";

let counter = 0;
const uniq = (prefix) => `${prefix}-${Date.now()}-${++counter}`;
// Short unique string for fields with maxlength constraints (e.g. displayName ≤ 20)
const shortUniq = () => String(Date.now()).slice(-8) + String(++counter).padStart(4, "0");

export async function makeCompany(overrides = {}) {
  // Create a bootstrap user for createdBy if not provided
  let createdBy = overrides.createdBy;
  if (!createdBy) {
    const user = await User.create({
      displayName: shortUniq(),
      name: "Creator User",
      email: `${uniq("creator")}@example.com`,
      role: "System_Admin",
      address: {
        street1: "1 Creator St",
        city: "Creator City",
        state: "TX",
        zipCode: "12345",
        country: "US",
      },
      createdBy: new mongoose.Types.ObjectId(),
    });
    createdBy = user._id;
  }

  return Company.create({
    companyName: uniq("Acme"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    createdBy,
    ...overrides,
  });
}

export async function makeFacility(company, overrides = {}) {
  // createdBy is required; create a bootstrap user if not supplied
  let createdBy = overrides.createdBy;
  if (!createdBy) {
    const user = await User.create({
      displayName: shortUniq(),
      name: "Facility Creator",
      email: `${uniq("fc")}@example.com`,
      role: "System_Admin",
      address: {
        street1: "1 FC St",
        city: "FC City",
        state: "TX",
        zipCode: "12345",
        country: "US",
      },
      createdBy: new mongoose.Types.ObjectId(),
    });
    createdBy = user._id;
  }

  return Facility.create({
    company: company._id,
    facilityName: uniq("Facility"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    contactInfo: { phone: "5550100000", email: "f@example.com" },
    createdBy,
    ...overrides,
  });
}

export async function makeUnit(facility, overrides = {}) {
  // createdBy is required; create a bootstrap user if not supplied
  let createdBy = overrides.createdBy;
  if (!createdBy) {
    const user = await User.create({
      displayName: shortUniq(),
      name: "Unit Creator",
      email: `${uniq("uc")}@example.com`,
      role: "System_Admin",
      address: {
        street1: "1 UC St",
        city: "UC City",
        state: "TX",
        zipCode: "12345",
        country: "US",
      },
      createdBy: new mongoose.Types.ObjectId(),
    });
    createdBy = user._id;
  }

  return StorageUnit.create({
    facility: facility._id,
    unitNumber: uniq("U"),
    unitType: "Standard",
    status: "Vacant",
    specifications: { width: 10, depth: 10, height: 8, unit: "ft" },
    paymentInfo: { pricePerMonth: 100 },
    createdBy,
    ...overrides,
  });
}

export async function makeUser(overrides = {}) {
  // Create a bootstrap user first if createdBy is not provided
  let createdBy = overrides.createdBy;
  if (!createdBy) {
    const bootstrap = await User.create({
      displayName: shortUniq(),
      name: "Bootstrap User",
      email: `${uniq("bootstrap")}@example.com`,
      role: "System_Admin",
      address: {
        street1: "1 Bootstrap St",
        city: "Bootstrap City",
        state: "TX",
        zipCode: "12345",
        country: "US",
      },
      createdBy: new mongoose.Types.ObjectId(),
    });
    createdBy = bootstrap._id;
  }

  return User.create({
    displayName: shortUniq(),
    name: "Test User",
    email: `${uniq("u")}@example.com`,
    address: {
      street1: "1 Main St",
      city: "Test City",
      state: "TX",
      zipCode: "12345",
      country: "US",
    },
    role: "System_Admin",
    createdBy,
    ...overrides,
  });
}

export async function makeTenant(overrides = {}) {
  // company is required by schema; create one if caller didn't supply it
  let company = overrides.company;
  if (!company) {
    const c = await makeCompany();
    company = c._id;
  }

  return Tenant.create({
    firstName: "Test",
    lastName: "Tenant",
    username: uniq("tu"),
    password: "Password1!",
    dateOfBirth: "1990-01-01",
    company,
    contactInfo: {
      phone: "5550101234",
      email: `${uniq("t")}@example.com`,
    },
    address: {
      street1: "1 Tenant St",
      city: "Tenant City",
      state: "TX",
      zipCode: "12345",
      country: "US",
    },
    vehicle: {
      DLNumber: "DL12345678",
      DLExpire: new Date("2030-01-01"),
      DLState: "TX",
    },
    ...overrides,
  });
}

export async function makeRental(unit, tenant, overrides = {}) {
  return Rental.create({
    unit: unit._id,
    tenant: tenant._id,
    startDate: new Date(),
    status: "Active",
    ...overrides,
  });
}

export async function makePayment(rental, overrides = {}) {
  return Payment.create({
    rental: rental._id,
    amount: 100,
    currency: "USD",
    status: "Succeeded",
    ...overrides,
  });
}

export function oid() {
  return new mongoose.Types.ObjectId().toString();
}
