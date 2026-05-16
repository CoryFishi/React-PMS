// Schemas
import Company from "../models/company.js";
import StorageFacility from "../models/facility.js";
import mongoose from "mongoose";
import StorageUnit from "../models/unit.js";
import User from "../models/user.js";
import Tenant from "../models/tenant.js";
import Event from "../models/event.js";
import Rental from "../models/rental.js";
import { fillMonthly, monthsAgo } from "../helpers/dashboard.js";
import { getStripeClient } from "../services/stripeConnect.js";

const requireStripeClient = () => getStripeClient();

const toStripeAmount = (price) => {
  const normalized = Number(price);
  if (!Number.isFinite(normalized)) {
    throw new Error("Invalid price provided for Stripe");
  }
  return Math.round(normalized * 100);
};

const createStripeUnitResources = async ({
  unit,
  facility,
  company,
  unitId,
}) => {
  const stripeClient = requireStripeClient();
  const stripeAccountId = company.stripe?.accountId;

  if (!stripeAccountId) {
    throw new Error("Company is not connected to Stripe");
  }

  const priceInCents = toStripeAmount(unit.paymentInfo?.pricePerMonth);

  let product = null;

  try {
    product = await stripeClient.products.create(
      {
        name: `${facility.facilityName} - Unit ${unit.unitNumber}`,
        metadata: {
          facilityId: facility._id.toString(),
          companyId: company._id.toString(),
          unitNumber: unit.unitNumber,
          ...(unitId ? { unitId: unitId.toString() } : {}),
        },
      },
      { stripeAccount: stripeAccountId }
    );

    const price = await stripeClient.prices.create(
      {
        currency: "usd",
        unit_amount: priceInCents,
        product: product.id,
        recurring: { interval: "month" },
        metadata: {
          facilityId: facility._id.toString(),
          companyId: company._id.toString(),
          unitNumber: unit.unitNumber,
          ...(unitId ? { unitId: unitId.toString() } : {}),
        },
      },
      { stripeAccount: stripeAccountId }
    );

    return { product, price, stripeAccountId };
  } catch (error) {
    if (product?.id) {
      try {
        await stripeClient.products.update(
          product.id,
          { active: false },
          { stripeAccount: stripeAccountId }
        );
      } catch (cleanupError) {
        console.error("Failed to clean up Stripe product:", cleanupError);
      }
    }
    throw error;
  }
};

// Create a new facility
export const createFacility = async (req, res) => {
  try {
    // Whitelist only client-editable fields (F-007: block mass-assignment).
    // Non-editable fields (status, createdBy, units, _id) are set server-side or by schema.
    const {
      facilityName,
      address,
      contactInfo,
      manager,
      settings,
      tags,
      photos,
      company: companyId,
    } = req.body;

    // Find manager by id
    if (manager && !mongoose.Types.ObjectId.isValid(manager)) {
      const managerDoc = await User.findOne({ _id: manager });
      if (!managerDoc) {
        console.error("Rejecting create facility due to no manager found!");
        return res.status(404).json({
          error: "Manager does not exist!",
        });
      }
    }
    // Find company by id
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      console.error("Rejecting create facility due to no company found!");
      return res.status(404).json({
        error: "Company does not exist!",
      });
    }

    const facility = await StorageFacility.create({
      facilityName,
      address,
      contactInfo,
      manager,
      settings,
      tags,
      photos,
      company: companyId,
      // status: omitted — schema default "Pending Deployment" applies
      createdBy: req.user?.id || req.user?._id,
    });
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
      console.error(error);
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Delete Facility
export const deleteFacility = async (req, res) => {
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
export const editFacility = async (req, res) => {
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
    // Whitelist only client-editable fields (F-007: block mass-assignment).
    // company, status, createdBy, units, _id are NOT editable via this handler.
    const {
      facilityName,
      address,
      contactInfo,
      manager,
      settings,
      tags,
      photos,
    } = req.body;

    const updates = { facilityName, address, contactInfo, manager, settings, tags, photos };
    // Strip undefined values so they don't overwrite existing data with null
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const facility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      updates,
      { new: true, runValidators: true }
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
export const addUnit = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { createdBy, unit } = req.body;

    // Validate input
    if (!unit || typeof unit !== "object") {
      return res.status(400).json({
        error: "Must provide a single unit object in the 'unit' field",
      });
    }

    // Make sure the facility exists
    const facility = await StorageFacility.findById(facilityId);
    if (!facility) {
      return res.status(406).json({ error: "Facility not found" });
    }

    const company = await Company.findById(facility.company);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check required fields
    if (!unit.unitNumber) {
      return res.status(400).json({ error: "Unit Number is required" });
    }
    if (unit.paymentInfo.pricePerMonth == null) {
      return res.status(400).json({ error: "Monthly Rate is required" });
    }
    if (unit.specifications.width == null) {
      return res.status(400).json({ error: "Monthly Rate is required" });
    }
    if (unit.specifications.depth == null) {
      return res.status(400).json({ error: "Monthly Rate is required" });
    }
    if (unit.specifications.height == null) {
      return res.status(400).json({ error: "Monthly Rate is required" });
    }

    // Check for duplicates
    const unitExists = await checkUnitInFacility(facilityId, unit.unitNumber);
    if (unitExists) {
      return res.status(409).json({
        error: `Unit Number ${unit.unitNumber} is already taken in this facility`,
      });
    }

    // Attach ownership fields
    unit.createdBy = createdBy;
    unit.facility = facilityId;

    let stripeResources;
    try {
      stripeResources = await createStripeUnitResources({
        unit,
        facility,
        company,
      });

      unit.stripe = {
        productId: stripeResources.product.id,
        priceId: stripeResources.price.id,
        accountId: stripeResources.stripeAccountId,
        currency: stripeResources.price.currency,
        priceAmount: stripeResources.price.unit_amount,
        lastSyncedAt: new Date(),
      };
    } catch (stripeError) {
      console.error(
        "Error provisioning Stripe resources for unit:",
        stripeError
      );
      return res.status(502).json({
        error:
          stripeError.message ||
          "Failed to create Stripe pricing for the requested unit",
      });
    }

    // Create the unit
    const createdUnit = await StorageUnit.create(unit);

    // Link unit to facility
    await StorageFacility.findByIdAndUpdate(
      facilityId,
      { $push: { units: createdUnit._id } },
      { new: true }
    );

    // Log event
    await Event.create({
      eventType: "Application",
      eventName: "Unit Created",
      message: `Unit ${createdUnit.unitNumber} created`,
      facility: facilityId,
    });

    if (stripeResources?.product?.id) {
      const stripeClient = requireStripeClient();
      try {
        await stripeClient.products.update(
          stripeResources.product.id,
          {
            metadata: {
              ...stripeResources.product.metadata,
              unitId: createdUnit._id.toString(),
            },
          },
          { stripeAccount: stripeResources.stripeAccountId }
        );

        await stripeClient.prices.update(
          stripeResources.price.id,
          {
            metadata: {
              ...stripeResources.price.metadata,
              unitId: createdUnit._id.toString(),
            },
          },
          { stripeAccount: stripeResources.stripeAccountId }
        );
      } catch (metadataError) {
        console.error(
          "Failed to update Stripe metadata for unit:",
          metadataError
        );
      }
    }

    return res.status(201).json(createdUnit);
  } catch (err) {
    console.error("Error creating unit:", err);
    return res
      .status(500)
      .json({ error: "Failed to create unit: " + err.message });
  }
};

// Remove Unit
export const deleteUnit = async (req, res) => {
  const unitId = req.params.unitId;
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
export const editUnit = async (req, res) => {
  const { facilityId, unitId } = req.params;
  const updateData = req.body;

  try {
    // Check if facility exists
    const facility = await StorageFacility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const existingUnit = await StorageUnit.findById(unitId);
    if (!existingUnit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Check for duplicate unit number in the same facility
    const unitWithSameNumber = await StorageUnit.findOne({
      facility: facilityId,
      unitNumber: updateData.unitNumber,
    });

    if (unitWithSameNumber && unitWithSameNumber._id.toString() !== unitId) {
      return res.status(409).json({
        error: `Unit Number ${updateData.unitNumber} is already taken in this facility`,
      });
    }

    const existingUnitObj = existingUnit.toObject();
    let stripePayload = null;

    const hasPriceUpdate =
      updateData?.paymentInfo &&
      Object.prototype.hasOwnProperty.call(
        updateData.paymentInfo,
        "pricePerMonth"
      );

    if (hasPriceUpdate) {
      const newPriceValue = updateData.paymentInfo.pricePerMonth;

      if (typeof newPriceValue !== "number" || Number.isNaN(newPriceValue)) {
        return res
          .status(400)
          .json({ error: "A valid numeric pricePerMonth is required" });
      }

      const newPriceInCents = toStripeAmount(newPriceValue);
      const currentPriceAmount = existingUnitObj.stripe?.priceAmount;

      if (currentPriceAmount !== newPriceInCents) {
        const company = await Company.findById(facility.company);
        if (!company) {
          return res.status(404).json({ error: "Company not found" });
        }

        try {
          const stripeAccountId = company.stripe?.accountId;
          if (!stripeAccountId) {
            return res
              .status(409)
              .json({ error: "Company is not connected to Stripe" });
          }

          const stripeClient = requireStripeClient();
          let productId = existingUnitObj.stripe?.productId;
          let createdResources = null;

          if (!productId) {
            createdResources = await createStripeUnitResources({
              unit: {
                ...existingUnitObj,
                paymentInfo: {
                  ...existingUnitObj.paymentInfo,
                  pricePerMonth: newPriceValue,
                },
              },
              facility,
              company,
              unitId,
            });

            stripePayload = {
              productId: createdResources.product.id,
              priceId: createdResources.price.id,
              accountId: createdResources.stripeAccountId,
              currency: createdResources.price.currency,
              priceAmount: createdResources.price.unit_amount,
              lastSyncedAt: new Date(),
            };

            productId = createdResources.product.id;

            try {
              await stripeClient.products.update(
                createdResources.product.id,
                {
                  metadata: {
                    ...createdResources.product.metadata,
                    unitId: unitId.toString(),
                  },
                },
                { stripeAccount: createdResources.stripeAccountId }
              );
            } catch (metadataError) {
              console.error(
                "Failed to update Stripe product metadata while editing unit:",
                metadataError
              );
            }
          }

          if (!createdResources) {
            const price = await stripeClient.prices.create(
              {
                currency: existingUnitObj.stripe?.currency || "usd",
                unit_amount: newPriceInCents,
                product: productId,
                recurring: { interval: "month" },
                metadata: {
                  facilityId: facility._id.toString(),
                  companyId: facility.company.toString(),
                  unitNumber: existingUnit.unitNumber,
                  unitId: unitId.toString(),
                },
              },
              { stripeAccount: stripeAccountId }
            );

            stripePayload = {
              ...(existingUnitObj.stripe || {}),
              productId,
              accountId: stripeAccountId,
              priceId: price.id,
              currency: price.currency,
              priceAmount: price.unit_amount,
              lastSyncedAt: new Date(),
            };
          }
        } catch (stripeError) {
          console.error("Error updating Stripe pricing for unit:", stripeError);
          return res.status(502).json({
            error:
              stripeError.message ||
              "Failed to update Stripe pricing for the requested unit",
          });
        }
      }
    }

    if (stripePayload) {
      updateData.stripe = stripePayload;
    }

    const updatedUnit = await StorageUnit.findByIdAndUpdate(
      unitId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUnit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    await Event.create({
      eventType: "Application",
      eventName: "Unit Updated",
      message: `Unit ${updatedUnit.unitNumber} updated`,
      facility: facilityId,
    });

    res
      .status(200)
      .json({ message: "Unit updated successfully", unit: updatedUnit });
  } catch (err) {
    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ error: "Validation failed", details: messages });
    }

    // Generic or unexpected errors
    console.error("Error updating unit:", err);
    await Event.create({
      eventType: "Application",
      eventName: "Unit Update Failed",
      message: `${unitId} failed to update`,
      facility: facilityId,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get Unit by ID
export const getUnitById = async (req, res) => {
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

export const createNote = async (req, res) => {
  const { facilityId, unitId } = req.params;
  const { message, createdBy, requiredResponse, responseDate } = req.body;

  try {
    const unit = await StorageUnit.findById(unitId);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    const newNote = {
      message,
      createdBy,
      createdAt: new Date(),
      requiredResponse: Boolean(requiredResponse),
      ...(requiredResponse &&
        responseDate && { responseDate: new Date(responseDate) }),
    };

    // ✅ Correct: push the full note object
    unit.notes.push(newNote);
    await unit.save();

    res.status(201).json({ message: "Note added", note: newNote });
  } catch (err) {
    console.error("Error creating note:", err);
    res
      .status(500)
      .json({ error: "Failed to create note", details: err.message });
  }
};

export const editNote = async (req, res) => {
  const { unitId, noteIndex } = req.params;
  const update = req.body;

  try {
    const unit = await StorageUnit.findById(unitId);
    if (!unit) return res.status(404).json({ error: "Unit not found" });

    if (!unit.notes[noteIndex])
      return res.status(404).json({ error: "Note not found" });

    Object.assign(unit.notes[noteIndex], update);
    await unit.save();

    res.json({ message: "Note updated", note: unit.notes[noteIndex] });
  } catch (err) {
    console.error("editNote failed:", err);
    return res.status(500).json({ error: "Failed to update note" });
  }
};

// Remove tenant from unit
export const removeTenant = async (req, res) => {
  try {
    const { unitId, facilityId } = req.params;

    const unit = await StorageUnit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found!" });
    }
    if (!unit.tenant) {
      return res.status(404).json({ error: "Unit does not have a tenant" });
    }

    const tenantId = unit.tenant;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      await Event.create([
        {
          eventType: "Application",
          eventName: "Unit Update Failed",
          message: `${unitId} failed to update due to tenant not found`,
          facility: facilityId,
        },
        {
          eventType: "Application",
          eventName: "Tenant Update Failed",
          message: `${tenantId} failed to update due to tenant not found`,
          facility: facilityId,
        },
      ]);
      return res.status(404).json({ error: "Tenant not found!" });
    }

    // ✅ Remove unit from tenant's unit list
    tenant.units = (tenant.units || []).filter(
      (id) => id.toString() !== unit._id.toString()
    );
    await tenant.save({ validateBeforeSave: false });

    // ✅ Update unit fields
    unit.tenant = null;
    unit.availability = true;
    unit.status = "Vacant";
    unit.paymentInfo.balance = 0;
    unit.lastMoveOutDate = new Date();
    await unit.save();

    // ✅ Log events
    await Event.create([
      {
        eventType: "Application",
        eventName: "Unit Updated",
        message: `Unit ${unit.unitNumber} had Tenant ${tenant.firstName} ${tenant.lastName} removed`,
        facility: facilityId,
      },
      {
        eventType: "Application",
        eventName: "Tenant Updated",
        message: `Tenant ${tenant.firstName} ${tenant.lastName} removed from ${unit.unitNumber}`,
        facility: facilityId,
      },
    ]);

    return res.status(200).json(unit);
  } catch (error) {
    console.error("Error in removeTenant:\n" + error.message);
    await Event.create({
      eventType: "Application",
      eventName: "Unit Update Failed",
      message: `${req.params.unitId} failed to remove tenant`,
      facility: req.params.facilityId,
    });
    res.status(400).json({ message: error.message });
  }
};

// Get all Units or by facility
export const getUnits = async (req, res) => {
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
export const getVacantUnits = async (req, res) => {
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
export const getFacilities = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isSystem = user.role === "System_Admin" || user.role === "System_User";
    const filter = isSystem ? {} : { company: user.company };

    const facilities = await StorageFacility.find(filter).sort({ facilityName: 1 });
    return res.status(200).json({ facilities });
  } catch (err) {
    console.error("getFacilities failed:", err);
    return res.status(500).json({ error: "Failed to fetch facilities" });
  }
};

export const getFacilitiesAndCompany = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin =
      user.role === "System_Admin" || user.role === "Company_Admin";

    const query = isAdmin
      ? user.role === "Company_Admin"
        ? { company: user.company }
        : {}
      : { company: user.company };

    const facilities = await StorageFacility.find(query)
      .populate("company", "companyName")
      .populate("manager", "name")
      .sort({ facilityName: 1 });

    return res.status(200).json({ facilities });
  } catch (error) {
    console.error("Error fetching facilities and companies:", error);
    return res
      .status(500)
      .json({ message: "Error fetching facilities and companies" });
  }
};

// Get Facility by ID
export const getFacilityById = async (req, res) => {
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
export const getAmenities = async (req, res) => {
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
export const getSecurityLevels = async (req, res) => {
  //needs to be converted to be stored in database
  const securityLevels = [
    { _id: "1", securityLevelName: "Basic" },
    { _id: "2", securityLevelName: "Enhanced" },
    { _id: "3", securityLevelName: "High" },
  ];
  res.status(200).json(securityLevels);
};

export const deployFacility = async (req, res) => {
  const facilityId = req.query.facilityId;
  try {
    // Whitelist: only status may be changed via this handler (F-007: block mass-assignment).
    const { status } = req.body;
    const allowedStatuses = ["Pending Deployment", "Disabled", "Enabled", "Maintenance"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const facility = await StorageFacility.findByIdAndUpdate(
      facilityId,
      { status },
      { new: true, runValidators: true }
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

export const addUnitType = async (req, res) => {
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

export const deleteUnitType = async (req, res) => {
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

export const editUnitType = async (req, res) => {
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

export const addAmenity = async (req, res) => {
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

export const deleteAmenity = async (req, res) => {
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

export const editAmenity = async (req, res) => {
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
export const checkUnitInFacility = async (facilityId, unitNumber) => {
  const facility = await StorageFacility.findById(facilityId).populate({
    path: "units",
    match: { unitNumber: unitNumber },
  });
  return facility && facility.units && facility.units.length > 0;
};

export const getFacilityDashboardData = async (req, res) => {
  try {
    const { facilityId } = req.params;

    if (!facilityId) {
      return res.status(400).json({ message: "Facility ID is required" });
    }

    // Unit counts specific to the facility
    const units = await StorageUnit.find({ facility: facilityId });

    // Tenant counts specific to the facility
    const activeTenants = await Tenant.countDocuments({
      facility: facilityId,
      status: "Active",
    });
    const disabledTenants = await Tenant.countDocuments({
      facility: facilityId,
      status: "Disabled",
    });

    const events = await Event.find({
      facility: facilityId,
    })
      .limit(250)
      .sort({ createdAt: -1 });

    const now = new Date();
    const TREND_MONTHS = 6;
    const trendStart = monthsAgo(TREND_MONTHS, now);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueTrendRows,
      activityTrendRows,
      totalRevenueAgg,
      last30RevenueAgg,
      rentalStatusRows,
      signingStatusRows,
    ] = await Promise.all([
      Rental.aggregate([
        {
          $match: {
            facility: new mongoose.Types.ObjectId(facilityId),
            status: "paid",
            updatedAt: { $gte: trendStart, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$updatedAt" },
              month: { $month: "$updatedAt" },
            },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Event.aggregate([
        {
          $match: {
            facility: new mongoose.Types.ObjectId(facilityId),
            createdAt: { $gte: trendStart, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Rental.aggregate([
        {
          $match: {
            facility: new mongoose.Types.ObjectId(facilityId),
            status: "paid",
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Rental.aggregate([
        {
          $match: {
            facility: new mongoose.Types.ObjectId(facilityId),
            status: "paid",
            updatedAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Rental.aggregate([
        { $match: { facility: new mongoose.Types.ObjectId(facilityId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Rental.aggregate([
        { $match: { facility: new mongoose.Types.ObjectId(facilityId) } },
        { $group: { _id: "$signingStatus", count: { $sum: 1 } } },
      ]),
    ]);

    const countByKey = (rows) =>
      rows.reduce((acc, r) => {
        acc[r._id ?? "unknown"] = r.count;
        return acc;
      }, {});

    const rentedUnits = units.filter((u) => u.status === "Rented").length;
    const delinquentUnits = units.filter(
      (u) => u.status === "Delinquent"
    ).length;
    const vacantUnits = units.filter((u) => u.status === "Vacant").length;
    const occupiedUnits = rentedUnits + delinquentUnits;
    const pct = (part, whole) =>
      whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

    res.status(200).json({
      units,
      unitStats: {
        total: units.length,
        rented: rentedUnits,
        vacant: vacantUnits,
        delinquent: delinquentUnits,
        occupied: occupiedUnits,
        occupancyRate: pct(occupiedUnits, units.length),
        delinquencyRate: pct(delinquentUnits, units.length),
      },
      tenants: {
        total: activeTenants + disabledTenants,
        active: { label: "Active", value: activeTenants, color: "green" },
        disabled: { label: "Disabled", value: disabledTenants, color: "red" },
      },
      revenue: {
        total: totalRevenueAgg[0]?.amount || 0,
        last30: last30RevenueAgg[0]?.amount || 0,
        trend: fillMonthly(revenueTrendRows, TREND_MONTHS, "amount", now),
      },
      rentals: {
        byStatus: countByKey(rentalStatusRows),
        signing: countByKey(signingStatusRows),
      },
      activityTrend: fillMonthly(activityTrendRows, TREND_MONTHS, "count", now),
      events,
    });
  } catch (error) {
    console.error("Error fetching facility dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
};
