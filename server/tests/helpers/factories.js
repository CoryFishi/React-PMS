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

export async function makeCompany(overrides = {}) {
  return Company.create({
    companyName: uniq("Acme"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    ...overrides,
  });
}

export async function makeFacility(company, overrides = {}) {
  return Facility.create({
    company: company._id,
    facilityName: uniq("Facility"),
    status: "Enabled",
    address: { street1: "1 Main", city: "X", state: "TX", zipCode: "00000", country: "US" },
    contactInfo: { phone: "555-0100", email: "f@example.com" },
    ...overrides,
  });
}

export async function makeUnit(facility, overrides = {}) {
  return StorageUnit.create({
    facility: facility._id,
    unitNumber: uniq("U"),
    status: "Vacant",
    specifications: { width: 10, depth: 10, height: 8, unit: "ft" },
    paymentInfo: { pricePerMonth: 100, currency: "USD" },
    ...overrides,
  });
}

export async function makeUser(overrides = {}) {
  return User.create({
    displayName: uniq("user"),
    name: { firstName: "Test", lastName: "User" },
    email: `${uniq("u")}@example.com`,
    role: "System_Admin",
    ...overrides,
  });
}

export async function makeTenant(overrides = {}) {
  return Tenant.create({
    firstName: "Test",
    lastName: "Tenant",
    email: `${uniq("t")}@example.com`,
    phone: "555-0101",
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
