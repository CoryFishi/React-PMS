// Schemas
const Company = require("../models/company");
const StorageFacility = require("../models/facility");
const StorageUnit = require("../models/unit");
const User = require("../models/user");
const Tenant = require("../models/tenant");
const Event = require("../models/event");
const mongoose = require("mongoose");

// Create a new facility
const createFacility = async (req, res) => {
  try {
    // Find manager by id
    if (
      req.body.manager &&
      !mongoose.Types.ObjectId.isValid(req.body.manager)
    ) {
      const manager = await User.findOne({ _id: req.body.manager });
      if (!manager) {
        console.error("Rejecting create facility due to no manager found!");
        return res.status(404).json({
          error: "Manager does not exist!",
        });
      }
    }
    // Find company by id
    const company = await Company.findOne({ _id: req.body.company });
    if (!company) {
      console.error("Rejecting create facility due to no company found!");
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

    await Event.create({
      eventType: "Application",
      eventName: "Facility Created",
      message: `${facility.facilityName} created`,
      facility: facility._id,
    });

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
  try {
    const facilityId = req.query.facilityId;
    if (!facilityId) {
      console.error("Rejecting delete facility due to no facility ID");
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
      console.error("Rejecting delete facility due to no facility found!");
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
    await Event.create({
      eventType: "Application",
      eventName: "Facility Deleted",
      message: `${facility.facilityName} deleted`,
      facility: facility._id,
    });
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
  console.log(req.body);
  const facilityId = req.query.facilityId;
  // Find manager by id
  if (req.body.manager) {
    const managerExist = await User.findById(req.body.manager);
    if (!managerExist) {
      console.error("Rejecting edit facility due to manager not found!");
      return res.status(404).json({
        error: "Manager does not exist!",
      });
    }
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

    await Event.create({
      eventType: "Application",
      eventName: "Facility Updated",
      message: `${facility.facilityName} updated`,
      facility: facilityId,
    });

    res.send(facilityWithCompany);
  } catch (error) {
    console.error("Failed to update facility:", error);
    console.error(error.name);
    res.status(500).send({ message: "Failed to update facility" });
  }
};

// Add Unit(s)
const addUnits = async (req, res) => {
  try {
    const { facilityId, createdBy, units } = req.body;
    // Make sure the facility exists
    const facilityExists = await StorageFacility.findById(facilityId);
    if (!facilityExists) {
      return res.status(406).json({
        error: `Facility not found`,
      });
    }
    // Make sure we have an array of units
    if (!Array.isArray(units) || units.length === 0) {
      return res.status(400).json({
        error: "Must provide an array of units in 'units' field",
      });
    }
    const createdUnits = [];
    // Iterate over each unit object
    for (const singleUnit of units) {
      // Attach createdBy & facility to each object
      singleUnit.createdBy = createdBy;
      singleUnit.facility = facilityId;
      // Check for required fields
      if (!singleUnit.unitNumber) {
        return res.status(409).json({
          error: "unitNumber is required",
        });
      }
      if (!singleUnit.paymentInfo?.pricePerMonth) {
        return res.status(400).json({
          error: "pricePerMonth is required",
        });
      }
      // Check for duplicates in the same facility
      const unitExists = await checkUnitInFacility(
        facilityId,
        singleUnit.unitNumber
      );
      if (unitExists) {
        return res.status(409).json({
          error: `Unit Number ${singleUnit.unitNumber} is already taken in this facility`,
        });
      }
      // Create the unit in the DB
      const createdUnit = await StorageUnit.create(singleUnit);
      createdUnits.push(createdUnit);
      // Push the newly created unit into the facility’s units array
      await StorageFacility.findByIdAndUpdate(
        facilityId,
        { $push: { units: createdUnit } },
        { new: true, useFindAndModify: false }
      );
      // Record an event for each unit created
      await Event.create({
        eventType: "Application",
        eventName: "Unit Created",
        message: `Unit ${createdUnit.unitNumber} created`,
        facility: facilityExists._id,
      });
    }
    // Return the array of created units
    return res.status(201).json(createdUnits);
  } catch (err) {
    console.error("Error creating units:", err);
    return res.status(500).json({ error: "Failed to create units: " + err });
  }
};

// Remove Unit
const deleteUnit = async (req, res) => {
  const unitId = req.query.unitId;
  if (!unitId) {
    console.error("Rejecting delete unit due to no unit id");
    return res.json({
      error: "id is required",
    });
  }
  try {
    const tenantExist = await Tenant.findOne({ units: unitId });
    if (tenantExist) {
      console.error(
        "Rejecting delete unit due to unit having assigned tenants"
      );
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
      await Event.create({
        eventType: "Application",
        eventName: "Unit Deleted",
        message: `Unit ${result.unitNumber} deleted`,
        facility: result.facility,
      });
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
  try {
    const facilityId = req.body.facilityId;
    const unitId = req.body.unitId;
    const updateData = req.body.updateData;
    // Check if facility exists
    const facilityData = await StorageUnit.findOne({
      _id: unitId,
    }).populate("facility");
    if (!facilityData) {
      console.error("rejecting edit unit due to no unit found");
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

    await Event.create({
      eventType: "Application",
      eventName: "Unit Updated",
      message: `Unit ${updatedUnit.unitNumber} updated`,
      facility: facilityId,
    });
    res.status(200).json({
      message: "Unit updated successfully",
      unit: updatedUnit,
    });
  } catch (error) {
    console.error("Error updating unit:", error);
    await Event.create({
      eventType: "Application",
      eventName: "Unit Update Failed",
      message: `${unitId} failed to update`,
      facility: facilityId,
    });
    res
      .status(500)
      .send({ message: "Error updating unit", error: error.message });
  }
};

// Get Unit by ID
const getUnitById = async (req, res) => {
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
  try {
    const { unitId, facilityId } = req.params;

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
        await Event.create({
          eventType: "Application",
          eventName: "Unit Update Failed",
          message: `${unitId} failed to update due to tenant not found`,
          facility: facilityId,
        });
        await Event.create({
          eventType: "Application",
          eventName: "Tenant Update Failed",
          message: `${tenantId} failed to update due to tenant not found`,
          facility: facilityId,
        });
        return res.status(404).json({ error: "Tenant not found!" });
      }

      // Remove the unit reference from the tenant's units array
      tenant.units = tenant.units.filter((id) => !id.equals(unit._id));
      await tenant.save({ validateBeforeSave: false });

      // Remove the tenant reference from the unit
      unit.tenant = null;
      unit.availability = true;
      unit.paymentInfo.balance = 0;
      unit.paymentInfo.moveInDate = null;
      unit.paymentInfo.moveOutDate = Date.now();
      unit.status = "Vacant";
      await unit.save();

      // // Check if the tenant has any other units left
      // if (tenant.units.length === 0) {
      //   await Tenant.findByIdAndDelete(tenantId);
      //   return res.status(200).json(unit);
      // }
      await Event.create({
        eventType: "Application",
        eventName: "Unit Updated",
        message: `Unit ${unit.unitNumber} had Tenant ${tenant.firstName} ${tenant.lastName} removed`,
        facility: facilityId,
      });
      await Event.create({
        eventType: "Application",
        eventName: "Tenant Updated",
        message: `Tenant ${tenant.firstName} ${tenant.lastName} removed from ${unit.unitNumber}`,
        facility: facilityId,
      });
      return res.status(200).json(unit);
    } else {
      return res.status(404).json({ error: "Unit does not have a tenant" });
    }
  } catch (error) {
    console.error(
      "Error processing the last call! See error below...\n" + error.message
    );
    await Event.create({
      eventType: "Application",
      eventName: "Unit Update Failed",
      message: `${unitId} failed to remove tenant`,
      facility: facilityId,
    });
    res.status(400).json({ message: error.message });
  }
};

// Get all Units or by facility
const getUnits = async (req, res) => {
  const facilityId = req.params.facilityId;
  try {
    var facilityWithUnits = [];
    if (!facilityId) {
      facilityWithUnits = await StorageUnit.find({}).sort({ unitNumber: 1 });
      if (!facilityWithUnits) {
        return res.status(404).send({ message: "No units found" });
      }
      res.status(200).json({
        units: facilityWithUnits,
      });
    } else {
      facilityWithUnits = await StorageUnit.find({ facility: facilityId })
        .populate({
          path: "tenant",
          model: "Tenant",
        })
        .sort({ unitNumber: 1 })
        .exec();
      if (!facilityWithUnits) {
        return res.status(404).send({ message: "Facility not found" });
      }
      res.status(200).json({
        units: facilityWithUnits,
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
  const facilityId = req.params.facilityId;
  try {
    const facilityWithUnits = await StorageFacility.findById(facilityId)
      .populate({
        path: "units",
        match: { availability: true },
      })
      .sort({ unitNumber: 1 })
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
  const facilities = await StorageFacility.find({}).sort({ facilityName: 1 });
  res.status(200).json({ facilities });
};

const getFacilitiesAndCompany = async (req, res) => {
  try {
    var facilities;
    if (req.query.company) {
      facilities = await StorageFacility.find({ company: req.query.company })
        .populate("company", "companyName")
        .populate("manager", "name")
        .sort({ facilityName: 1 });
    } else {
      facilities = await StorageFacility.find({})
        .populate("company", "companyName")
        .populate("manager", "name")
        .sort({ facilityName: 1 });
    }
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
  //needs to be converted to be stored in database
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
  //needs to be converted to be stored in database
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

    await Event.create({
      eventType: "Application",
      eventName: "Facility Updated",
      message: `${facility.facilityName} updated`,
      facility: facilityId,
    });
    res.status(200).send(facilityWithCompany);
  } catch (error) {
    console.error("Failed to update facility:", error);
    console.error(error.name);
    res.status(500).send({ message: "Failed to update facility" });
  }
};

const addUnitType = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const newUnitType = req.body;

    const facilityExists = await StorageFacility.findById(facilityId);
    if (!facilityExists) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const updatedFacility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      { $push: { "settings.unitTypes": newUnitType } },
      { new: true, useFindAndModify: false }
    );

    return res.status(201).json(updatedFacility.settings.unitTypes);
  } catch (err) {
    console.error("Error adding a new unit type:", err);
    return res.status(500).json({ error: "Failed to add a new unit type." });
  }
};

const deleteUnitType = async (req, res) => {
  const { facilityId } = req.params;
  const { unitTypeId } = req.query;

  try {
    const facility = await StorageFacility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Filter out the unit type with the matching ID
    const initialLength = facility.settings.unitTypes.length;
    facility.settings.unitTypes = facility.settings.unitTypes.filter(
      (unitType) => unitType._id.toString() !== unitTypeId
    );

    if (initialLength === facility.settings.unitTypes.length) {
      return res.status(404).json({ message: "Unit Type not found" });
    }

    await facility.save();

    res.status(200).json({ message: "Unit Type deleted successfully" });
  } catch (error) {
    console.error("Error deleting unit type:", error);
    res.status(500).json({ message: "Failed to delete unit type" });
  }
};

const editUnitType = async (req, res) => {
  const { facilityId } = req.params;
  const { unitTypeId } = req.query;
  const updatedData = req.body;

  try {
    const facility = await StorageFacility.findById(facilityId);
    if (!facility)
      return res.status(404).json({ message: "Facility not found" });

    const unitType = facility.settings.unitTypes.id(unitTypeId);
    if (!unitType)
      return res.status(404).json({ message: "Unit Type not found" });

    Object.assign(unitType, updatedData);
    await facility.save();

    res
      .status(200)
      .json({ message: "Unit Type updated", updatedUnitType: unitType });
  } catch (error) {
    console.error("Error updating unit type:", error);
    res.status(500).json({ message: "Failed to update unit type" });
  }
};

const addAmenity = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const newAmenity = req.body;

    const facilityExists = await StorageFacility.findById(facilityId);
    if (!facilityExists) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const updatedFacility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      { $push: { "settings.amenities": newAmenity } },
      { new: true, useFindAndModify: false }
    );

    return res.status(201).json(updatedFacility.settings.amenities);
  } catch (err) {
    console.error("Error adding a new unit type:", err);
    return res.status(500).json({ error: "Failed to add a new unit type." });
  }
};

const deleteAmenity = async (req, res) => {
  const { facilityId } = req.params;
  const { amenityId } = req.query;

  try {
    const facility = await StorageFacility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Filter out the amenity with the matching ID
    const initialLength = facility.settings.amenities.length;
    facility.settings.amenities = facility.settings.amenities.filter(
      (amenity) => amenity._id.toString() !== amenityId
    );

    if (initialLength === facility.settings.amenities.length) {
      return res.status(404).json({ message: "Amenity not found" });
    }

    await facility.save();

    res.status(200).json({ message: "Amenity deleted successfully" });
  } catch (error) {
    console.error("Error deleting amenity:", error);
    res.status(500).json({ message: "Failed to delete amenity" });
  }
};

const editAmenity = async (req, res) => {
  const { facilityId } = req.params;
  const { amenityId } = req.query;
  const updatedData = req.body;

  try {
    const facility = await StorageFacility.findById(facilityId);
    if (!facility)
      return res.status(404).json({ message: "Facility not found" });

    const amenity = facility.settings.amenities.id(amenityId);
    if (!amenity) return res.status(404).json({ message: "Amenity not found" });

    Object.assign(amenity, updatedData);
    await facility.save();

    res
      .status(200)
      .json({ message: "Amenity updated", updatedAmenity: amenity });
  } catch (error) {
    console.error("Error updating amenity:", error);
    res.status(500).json({ message: "Failed to update amenity" });
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

// Exports
module.exports = {
  deleteAmenity,
  editAmenity,
  addAmenity,
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
  addUnitType,
  deleteUnitType,
  editUnitType,
};
