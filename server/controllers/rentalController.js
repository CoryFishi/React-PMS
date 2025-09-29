import Company from "../models/company.js";
import Facility from "../models/facility.js";
import Tenant from "../models/tenant.js";
import StorageUnit from "../models/unit.js";

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
  try {
    const { companyId, facilityId, unitId } = req.params;
    const { tenantInfo, leaseInfo } = req.body;

    // Validate input data
    if (!tenantInfo) {
      return res
        .status(400)
        .json({ message: "Tenant information are required." });
    }

    // Check if the unit is still vacant
    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
      status: "Vacant",
      availability: true,
    });
    if (!unit) {
      return res
        .status(400)
        .json({ message: "The selected unit is no longer available." });
    }

    const tenant = new Tenant(tenantInfo);
    await tenant.save();

    // const lease = new Lease({ ...leaseInfo, tenant: tenant._id, unit: unitId });
    // await lease.save();
    // Respond with success message
    return res.status(200).json({ message: "Tenant and lease created." });
  } catch (error) {
    console.error(
      "Error processing the createTenantAndLease call:\n" + error.message
    );
    return res.status(400).json({ message: error.message });
  }
};
