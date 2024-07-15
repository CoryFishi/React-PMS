// Schemas
const StorageFacility = require("../models/facility");
const StorageUnit = require("../models/unit");
const User = require("../models/user");
const Tenant = require("../models/tenant");

// Create Tenant
const createTenant = async (req, res) => {
  console.log("createTenant");
  try {
    const {
      firstName,
      lastName,
      contactInfo,
      address,
      units,
      paymentHistory,
      balance,
      status,
      company,
      accessCode,
      createdBy,
    } = req.body;

    for (const unit of units) {
      const unitExists = await StorageUnit.findById(unit);
      if (!unitExists) {
        return res.status(404).json({
          error: `Unit(s) ${unit} was not found`,
        });
      }
    }

    // Create tenant in database
    const tenant = await Tenant.create({
      firstName,
      lastName,
      contactInfo,
      address,
      units,
      paymentHistory,
      balance,
      status,
      company,
      accessCode,
      createdBy,
      moveInDate: null,
    });

    await StorageUnit.updateMany(
      { _id: { $in: units } },
      { $set: { tenant: tenant._id, availability: false } }
    );

    return res.status(201).json(tenant);
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

// Get Tenants by Facility
const getTenants = async (req, res) => {
  const facilityId = req.query.facilityId;
  const companyId = req.query.companyId;
  try {
    var tenants = [];
    if (facilityId) {
      units = await StorageUnit.find({ facility: facilityId }).select(
        "_id tenant"
      );
      // Extract unique tenant IDs from the units
      const tenantIds = [...new Set(units.map((unit) => unit.tenant))];

      // Retrieve tenant information from the Tenant collection using the unique tenant IDs
      tenants = await Tenant.find({ _id: { $in: tenantIds } }).sort({
        firstNameName: 1,
        lastName: 1,
      });
    } else if (companyId) {
      tenants = await Tenant.find({ company: companyId }).sort({
        firstNameName: 1,
        lastName: 1,
      });
    } else {
      tenants = await Tenant.find({}).sort({
        firstNameName: 1,
        lastName: 1,
      });
    }

    // Return the list of tenants
    return res.status(200).json(tenants);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Get Tenants by Id
const getTenantById = async (req, res) => {
  const tenantId = req.params.tenantId;
  try {
    const tenant = await Tenant.findById(tenantId).populate("units");

    return res.status(200).json(tenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Edit Tenant
const editTenant = async (req, res) => {
  const tenantId = req.body.tenantId;
  const updateData = req.body.updateData;

  try {
    const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, updateData, {
      new: true, // Return the updated document
    }).exec();

    if (!updatedTenant) {
      return res.status(404).send({ message: "Tenant not found" });
    }

    res.status(200).json({
      message: "Tenant updated successfully",
      Tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res
      .status(500)
      .send({ message: "Error updating tenant", error: error.message });
  }
};

// Remove Tenant
const deleteTenant = async (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) {
    return res.status(404).json({
      error: "id is required",
    });
  }
  try {
    // Check if tenant has units
    const unitsRented = await StorageUnit.find({ tenant: tenantId });
    if (unitsRented) {
      return res.status(409).send({ error: "Tenant is associated to unit(s)" });
    }
    // Delete the tenant
    const result = await Tenant.findByIdAndDelete(tenantId);
    if (result) {
      await StorageUnit.updateMany(
        { tenant: tenantId },
        { $pull: { tenant: tenantId } }
      );
      res.status(200).send({ message: "Tenant deleted" });
    } else {
      res.status(404).send({ message: "Tenant not found" });
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error deleting unit", error: error.message });
  }
};

const addUnitToTenant = async (req, res) => {
  const tenantId = req.params.tenantId;
  const unitId = req.body.unitId;
  const balance = req.body.balance;
  const currentDate = new Date();
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $addToSet: { units: [unitId] },
        $inc: { balance: balance },
      },
      { new: true, useFindAndModify: false }
    );

    await StorageUnit.findByIdAndUpdate(unitId, {
      tenant: tenantId,
      availability: false,
      $set: { moveInDate: currentDate },
    });

    res.status(200).json({
      tenant,
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res
      .status(500)
      .send({ message: "Error updating tenant", error: error.message });
  }
};

// Exports
module.exports = {
  createTenant,
  getTenants,
  editTenant,
  deleteTenant,
  addUnitToTenant,
  getTenantById,
};
