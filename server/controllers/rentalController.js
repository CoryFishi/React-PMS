import Company from "../models/company.js";
import Facility from "../models/facility.js";
import Tenant from "../models/tenant.js";
import StorageUnit from "../models/unit.js";
import {
  hashPassword,
  passwordValidator,
} from "../helpers/password.js";
import * as leaseService from "../services/leaseService.js";

// Get all companies
export const getCompanies = async (req, res) => {
  try {
    const query = { status: "Enabled" };

    const companies = await Company.find(query).select(
      "companyName address logo"
    );

    return res.status(200).json(companies);
  } catch (error) {
    console.error("Error processing the getCompanies call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};

// Get company by ID and only return enabled facilities
export const getCompanyDataById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const query = { status: "Enabled", _id: companyId };
    const company = await Company.find(query).select(
      "companyName address logo"
    );

    return res.status(200).json({ company: company });
  } catch (error) {
    console.error(
      "Error processing the getCompanyDataById call:\n" + error.message
    );
    return res.status(400).json({ message: error.message });
  }
};

// Get facilities and populate the lowest priced rentable unit for each
export const getFacilitiesLowestRate = async (req, res) => {
  try {
    const { companyId } = req.params;
    const facilities = await Facility.find({
      company: companyId,
      status: "Enabled",
    })
      .select("facilityName address contactInfo")
      .populate({
        path: "units",
        match: { status: "Vacant" },
        select: "paymentInfo.pricePerMonth unitNumber specifications",
        options: { sort: { "paymentInfo.pricePerMonth": 1 }, limit: 1 },
      });

    return res.status(200).json({ facilities });
  } catch (error) {
    console.error(
      "Error processing the getFacilitiesLowestRate call:\n" + error.message
    );
    return res.status(400).json({ message: error.message });
  }
};

// Get facility by ID and only return vacant units
export const getFacilityDataById = async (req, res) => {
  try {
    const { companyId, facilityId } = req.params;
    const facility = await Facility.findOne({
      _id: facilityId,
      company: companyId,
      status: "Enabled",
    })
      .populate({
        path: "units",
        match: { status: "Vacant" },
        select: "paymentInfo.pricePerMonth unitNumber specifications",
      })
      .select("facilityName address");

    return res.status(200).json({ facility });
  } catch (error) {
    console.error(
      "Error processing the getFacilityDataById call:\n" + error.message
    );
    return res.status(400).json({ message: error.message });
  }
};

// Get unit by ID within a facility and company, returning unit details
export const getUnitDataById = async (req, res) => {
  try {
    const { facilityId, unitId } = req.params;
    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
    }).select(
      "unitNumber specifications paymentInfo.pricePerMonth tags status unitType amenities"
    );

    return res.status(200).json({ unit });
  } catch (error) {
    console.error(
      "Error processing the getFacilityDataById call:\n" + error.message
    );
    return res.status(400).json({ message: error.message });
  }
};

export const createTenantAndLease = async (req, res) => {
  let tenant;
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { tenantInfo, successUrl, cancelUrl } = req.body;

    if (!tenantInfo) {
      return res.status(400).json({ message: "Tenant information is required." });
    }

    const existingUser = await Tenant.findOne({
      "contactInfo.email": tenantInfo.email,
      company: companyId,
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Please Login." });
    }

    passwordValidator(tenantInfo.password);

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const facility = await Facility.findById(facilityId);
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
      status: "Vacant",
      availability: true,
    });
    if (!unit) {
      return res.status(400).json({ message: "The selected unit is no longer available." });
    }

    tenant = await Tenant.create({
      firstName: tenantInfo.firstName,
      middleName: tenantInfo.middleInitial,
      lastName: tenantInfo.lastName,
      dateOfBirth: tenantInfo.dateOfBirth,
      isMilitary: tenantInfo.isMilitary,
      company: companyId,
      username: tenantInfo.username,
      password: await hashPassword(tenantInfo.password),
      businessName: tenantInfo.businessName,
      status: "New",
      recoveryQuestions: [
        { question: tenantInfo.recoveryQuestion1, answer: tenantInfo.recoveryAnswer1 },
        { question: tenantInfo.recoveryQuestion2, answer: tenantInfo.recoveryAnswer2 },
      ],
      contactInfo: {
        phone: tenantInfo.phone,
        alternatePhone: tenantInfo.additionalPhone,
        email: tenantInfo.email,
      },
      address: {
        street1: tenantInfo.street1,
        street2: tenantInfo.street2,
        city: tenantInfo.city,
        state: tenantInfo.state,
        zipCode: tenantInfo.zipCode,
        country: tenantInfo.country,
      },
      vehicle: {
        DLNumber: tenantInfo.DLNumber,
        DLExpire: tenantInfo.DLExpire,
        DLState: tenantInfo.DLState,
      },
    });

    try {
      const { checkoutUrl, rentalId } = await leaseService.startRental({
        company,
        facility,
        unit,
        tenant,
        successUrl,
        cancelUrl,
      });
      return res.status(200).json({ checkoutUrl, rentalId });
    } catch (stripeErr) {
      if (tenant?._id) {
        await Tenant.deleteOne({ _id: tenant._id });
      }
      console.error("startRental failed:", stripeErr.message);
      return res.status(502).json({ message: "Failed to start rental payment" });
    }
  } catch (error) {
    console.error("Error processing the createTenantAndLease call:\n" + error.message);
    return res.status(400).json({ message: error.message });
  }
};

export const loginTenantAndCreateLease = async (_req, res) => {
  // F-001 stub: the original implementation referenced undefined identifiers
  // (doc, envelopesApi, ACCOUNT_ID, Lease, leaseId) and crashed at runtime on
  // every call. A proper DocuSign-backed lease flow is tracked as follow-up
  // work. Returning 501 here is intentional and load-bearing — do not change
  // the status code without restoring real behavior.
  return res.status(501).json({
    message: "Existing-tenant lease flow is not yet implemented.",
  });
};
