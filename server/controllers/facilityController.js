// Schemas
const Company = require("../models/company");
const StorageFacility = require("../models/facility");
const StorageUnit = require("../models/unit");
const User = require("../models/user");
const Tenant = require("../models/tenant");
const mongoose = require("mongoose");

// Create a new facility
const createFacility = async (req, res) => {
  console.log("Create Facility called!");
  try {
    // Find manager by id
    if (
      req.body.manager &&
      !mongoose.Types.ObjectId.isValid(req.body.manager)
    ) {
      const manager = await User.findOne({ _id: req.body.manager });
      if (!manager) {
        console.log("Rejecting request due to no manager found!");
        return res.status(404).json({
          error: "Manager does not exist!",
        });
      }
    }
    // Find company by id
    const company = await Company.findOne({ _id: req.body.company });
    if (!company) {
      console.log("Rejecting request due to no company found!");
      return res.status(404).json({
        error: "Company does not exist!",
      });
    }
    const facility = await StorageFacility.create(req.body);
    const facilityWithCompanyAndManager = await StorageFacility.findById(
      facility._id
    )
      .populate("company", "companyName")
      .populate("manager", "name");

    await Company.findByIdAndUpdate(company._id, {
      $push: { facilities: facility._id },
    });
    console.log("Facility created! " + facility.facilityName);
    return res.status(201).json(facilityWithCompanyAndManager);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      console.error("Rejecting due to duplicate value");
      res.status(409).send({ error: `${duplicateValue} is already taken!` });
    } else {
      res.status(500).send({ error: error.name });
      console.log(error);
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Delete Facility
const deleteFacility = async (req, res) => {
  console.log("Delete Facility called!");
  try {
    const facilityId = req.query.facilityId;
    if (!facilityId) {
      return res.status(400).json({
        error: "Facility ID is required",
      });
    }
    const existfacility = await StorageFacility.findById(facilityId);
    const unitIds = existfacility.units;
    const units = await StorageUnit.find({
      _id: { $in: unitIds },
    });
    const tenantIds = units
      .map((unit) => unit.tenant)
      .filter((tenantId) => tenantId);
    const tenants = await Tenant.find({
      _id: { $in: tenantIds },
    }).populate("units");
    if (tenants.length > 0) {
      return res.status(409).json({
        error: "Can't delete facilities with active tenants!",
      });
    }
    const facility = await StorageFacility.findByIdAndDelete(facilityId);
    if (!facility) {
      console.log("Rejecting request due to no facility found!");
      return res.status(404).send({ message: "Facility not found" });
    }
    await StorageUnit.deleteMany({ facility: facilityId });
    await User.updateMany(
      { facilities: facilityId },
      { $pull: { facilities: facilityId } }
    );
    await Company.updateMany(
      { facilities: facilityId },
      { $pull: { facilities: facilityId } }
    );
    res
      .status(200)
      .send({ message: "Facility and all related units deleted successfully" });
  } catch (error) {
    console.error("Error deleting facility:", error);
    res
      .status(500)
      .send({ message: "Error deleting facility", error: error.message });
  }
};

// Edit Facility
const editFacility = async (req, res) => {
  console.log("EditFacility");
  const facilityId = req.query.facilityId;
  // Find manager by id
  if (req.body.manager) {
    const managerExist = await User.findById(req.body.manager);
    if (!managerExist) {
      console.log("Rejecting request due to no manager found!");
      return res.status(404).json({
        error: "Manager does not exist!",
      });
    }
  }
  // Find company by id
  const companyExist = await Company.findById(req.body.company);
  if (!companyExist || !req.body.company) {
    console.log("Rejecting request due to no company found!");
    return res.status(404).json({
      error: "Company does not exist!",
    });
  }
  try {
    const facility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      req.body,
      { new: true }
    );
    if (!facility) {
      return res.status(404).send({ message: "Facility not found" });
    }
    const facilityWithCompany = await StorageFacility.findById(facilityId)
      .populate("company", "companyName")
      .populate("manager", "name");

    res.send(facilityWithCompany);
  } catch (error) {
    console.error("Failed to update facility:", error);
    console.error(error.name);
    res.status(500).send({ message: "Failed to update facility" });
  }
};

// Add Unit(s)
const addUnits = async (req, res) => {
  console.log("AddUnits");
  const facilityId = req.body.facilityId;
  const createdBy = req.body.createdBy;
  let unitsData = req.body.units;
  const facilityExists = await StorageFacility.findById(facilityId);
  if (!facilityExists) {
    return res.status(406).json({
      error: `facility not found`,
    });
  }
  unitsData.forEach((unit) => {
    unit.createdBy = createdBy;
    unit.facility = facilityId;
  });
  for (const unit of unitsData) {
    if (!unit.unitNumber) {
      return res.status(409).json({
        error: "unitNumber is required",
      });
    }
    const unitExists = await checkUnitInFacility(facilityId, unit.unitNumber);
    if (unitExists) {
      return res.status(409).json({
        error: `Unit Number ${unit.unitNumber} is already taken in this facility`,
      });
    }
    if (!unit.pricePerMonth) {
      return res.status(400).json({
        error: "pricePerMonth is required",
      });
    }
  }
  try {
    const createdUnits = await StorageUnit.create(unitsData);
    const unitIds = createdUnits.map((unit) => unit._id);
    const updatedFacility = await updateFacilityWithUnits(facilityId, unitIds);
    res.status(201).json(createdUnits);
  } catch (err) {
    console.error("Error creating units:", err);
    res.status(500).json({ error: "Failed to create units " + err });
  }
};

// Remove Unit
const deleteUnit = async (req, res) => {
  console.log("Delete Unit");
  const unitId = req.query.unitId;
  if (!unitId) {
    return res.json({
      error: "id is required",
    });
  }
  try {
    const tenantExist = await Tenant.findOne({ units: unitId });
    if (tenantExist) {
      return res
        .status(400)
        .send({ message: "Can't delete unit(s) assigned to a tenant!" });
    }
    // Delete the unit
    const result = await StorageUnit.findByIdAndDelete(unitId);
    if (result) {
      await StorageFacility.updateMany(
        { units: unitId },
        { $pull: { units: unitId } }
      );
      res.status(200).send({ message: `Unit ${result.unitNumber} deleted` });
    } else {
      res.status(404).send({ message: "Unit not found" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error deleting unit", error: error.message });
  }
};

// Edit Unit
const editUnit = async (req, res) => {
  console.log("editUnit");

  const unitId = req.body.unitId;
  const updateData = req.body.updateData;
  // Check if facility exists
  const facilityData = await StorageUnit.findOne({
    _id: unitId,
  }).populate("facility");
  if (!facilityData) {
    return res.status(404).json({
      error: `Unit not found`,
    });
  }

  // Check if unit number already exists
  const unitExists = await StorageUnit.findOne({
    facility: facilityData.facility._id,
    unitNumber: updateData.unitNumber,
  });
  if (unitExists && unitExists._id.toString() !== unitId) {
    return res.status(409).json({
      error: `Unit Number ${updateData.unitNumber} is already taken in this facility`,
    });
  }
  try {
    // Validate updateData or sanitize as necessary
    const updatedUnit = await StorageUnit.findByIdAndUpdate(
      unitId,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Ensure model validations are run during update
      }
    ).exec();

    if (!updatedUnit) {
      return res.status(404).send({ message: "Unit not found" });
    }

    res.status(200).json({
      message: "Unit updated successfully",
      unit: updatedUnit,
    });
  } catch (error) {
    console.error("Error updating unit:", error);
    res
      .status(500)
      .send({ message: "Error updating unit", error: error.message });
  }
};

// Get Unit by ID
const getUnitById = async (req, res) => {
  console.log("Get Unit by Id called!");
  try {
    const { unitId } = req.params;
    const unit = await StorageUnit.findById(unitId).populate("tenant");
    res.status(200).json(unit);
  } catch (error) {
    console.error(
      "Error processing the last call! See error below...\n" + error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Remove tenant from unit
const removeTenant = async (req, res) => {
  console.log("Remove tenant from unit called!");
  try {
    const { unitId } = req.params;

    // Find the unit by ID
    const unit = await StorageUnit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found!" });
    }

    // Check if the unit has a tenant
    if (unit.tenant) {
      const tenantId = unit.tenant;

      // Find the tenant by ID
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found!" });
      }

      // Remove the unit reference from the tenant's units array
      tenant.units = tenant.units.filter((id) => !id.equals(unit._id));
      await tenant.save();

      // Remove the tenant reference from the unit
      unit.tenant = null;
      unit.availability = true;
      await unit.save();

      // Check if the tenant has any other units left
      if (tenant.units.length === 0) {
        await Tenant.findByIdAndDelete(tenantId);
        return res.status(200).json(unit);
      }

      return res.status(200).json(unit);
    } else {
      return res.status(404).json({ error: "Unit does not have a tenant" });
    }
  } catch (error) {
    console.error(
      "Error processing the last call! See error below...\n" + error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get all Units or by facility
const getUnits = async (req, res) => {
  console.log("Get units was called!");
  const facilityId = req.params.facilityId;
  try {
    var facilityWithUnits = [];
    if (!facilityId) {
      facilityWithUnits = await StorageUnit.find({});
      if (!facilityWithUnits) {
        return res.status(404).send({ message: "No units found" });
      }
      res.status(200).json({
        units: facilityWithUnits,
      });
    } else {
      facilityWithUnits = await StorageFacility.findById(facilityId)
        .populate({
          path: "units",
          populate: { path: "tenant" },
        })
        .exec();
      if (!facilityWithUnits) {
        return res.status(404).send({ message: "Facility not found" });
      }
      res.status(200).json({
        units: facilityWithUnits.units,
      });
    }
  } catch (error) {
    console.error("Error retrieving facility units:", error);
    res
      .status(500)
      .send({ message: "Error retrieving data", error: error.message });
  }
};

// Get all vacant units by facility
const getVacantUnits = async (req, res) => {
  console.log("Get vacant units was called!");
  const facilityId = req.params.facilityId;
  try {
    const facilityWithUnits = await StorageFacility.findById(facilityId)
      .populate({
        path: "units",
        match: { availability: true },
      })
      .exec();
    if (!facilityWithUnits) {
      return res.status(404).send({ message: "Facility not found" });
    }
    res.status(200).json({
      units: facilityWithUnits.units,
    });
  } catch (error) {
    console.error("Error retrieving facility units:", error);
    res
      .status(500)
      .send({ message: "Error retrieving data", error: error.message });
  }
};

// Get all Facilities
const getFacilities = async (req, res) => {
  console.log("Get Facilities called...");
  const facilities = await StorageFacility.find({});
  console.log("Facilities sent!");
  res.status(200).json({ facilities });
};

const getFacilitiesAndCompany = async (req, res) => {
  try {
    console.log("Get Facilities and Company Called...");
    var facilities;
    if (req.query.company) {
      facilities = await StorageFacility.find({ company: req.query.company })
        .populate("company", "companyName")
        .populate("manager", "name");
    } else {
      facilities = await StorageFacility.find({})
        .populate("company", "companyName")
        .populate("manager", "name");
    }
    console.log("Facilities with company sent!");
    res.status(200).json({ facilities });
  } catch (error) {
    console.error("Error fetching facilities and companies:", error);
    res
      .status(500)
      .json({ message: "Error fetching facilities and companies" });
  }
};

// Get Facility by ID
const getFacilityById = async (req, res) => {
  console.log("Get Facility by Id called!");
  try {
    const { facilityId } = req.params;
    const facility = await StorageFacility.findById(facilityId);
    res.status(200).json(facility);
  } catch (error) {
    console.error(
      "Error processing the last call! See error below...\n" + error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get the diferent types of amenities
const getAmenities = async (req, res) => {
  const amenitiesList = [
    { _id: "1", amenityName: "24/7 Access" },
    { _id: "2", amenityName: "Climate Control" },
    { _id: "3", amenityName: "Drive-Up Access" },
    { _id: "4", amenityName: "Security Cameras" },
    { _id: "5", amenityName: "On-Site Manager" },
    { _id: "6", amenityName: "Free Wi-Fi" },
  ];
  res.status(200).json(amenitiesList);
};

// Get the diferent types of amenities
const getSecurityLevels = async (req, res) => {
  const securityLevels = [
    { _id: "1", securityLevelName: "Basic" },
    { _id: "2", securityLevelName: "Enhanced" },
    { _id: "3", securityLevelName: "High" },
  ];
  res.status(200).json(securityLevels);
};

const deployFacility = async (req, res) => {
  const facilityId = req.query.facilityId;
  try {
    const facility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      req.body,
      { new: true }
    );
    if (!facility) {
      return res.status(404).send({ message: "Facility not found" });
    }
    const facilityWithCompany = await StorageFacility.findById(facilityId)
      .populate("company", "companyName")
      .populate("manager", "name");

    res.status(200).send(facilityWithCompany);
  } catch (error) {
    console.error("Failed to update facility:", error);
    console.error(error.name);
    res.status(500).send({ message: "Failed to update facility" });
  }
};

// Helpers
async function checkUnitInFacility(facilityId, unitNumber) {
  const facility = await StorageFacility.findById(facilityId).populate({
    path: "units",
    match: { unitNumber: unitNumber },
  });
  return facility && facility.units && facility.units.length > 0;
}
async function updateFacilityWithUnits(facilityId, unitIds) {
  try {
    return await StorageFacility.findByIdAndUpdate(
      facilityId,
      { $push: { units: { $each: unitIds } } },
      { new: true, useFindAndModify: false }
    );
  } catch (err) {
    console.error("Error updating facility:", err);
    throw err;
  }
}

// Exports
module.exports = {
  createFacility,
  getFacilities,
  deleteFacility,
  editFacility,
  addUnits,
  deleteUnit,
  getUnits,
  editUnit,
  getFacilitiesAndCompany,
  getAmenities,
  getSecurityLevels,
  getFacilityById,
  deployFacility,
  getUnitById,
  removeTenant,
  getVacantUnits,
};
