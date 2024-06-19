// Schemas
const Company = require("../models/company");
const StorageFacility = require("../models/facility");
const StorageUnit = require("../models/unit");
const User = require("../models/user");
const Tenant = require("../models/tenant");

// Create a new company
const createCompany = async (req, res) => {
  console.log("Create Company called!");
  try {
    const newCompany = await Company.create(req.body);
    res.status(201).json(newCompany);
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
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Get all companies
const getCompanies = async (req, res) => {
  console.log("Get Companies called!");
  try {
    const companies = await Company.find({});
    res.status(200).json(companies);
  } catch (error) {
    console.error(
      "Error processing the last get company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get Company by ID
const getCompanyById = async (req, res) => {
  console.log("Get Company by Id called!");
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    res.status(200).json(company);
  } catch (error) {
    console.error(
      "Error processing the last get company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

// Get all facilities apart of a company
const getFacilitiesByCompany = async (req, res) => {
  console.log("Get Facilities By Company called!");
  try {
    const { companyId } = req.params;
    const facilities = await StorageFacility.find({ company: companyId });
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching facilities", error });
  }
};

// Update a company by ID
const editCompany = async (req, res) => {
  console.log("Edit Company called!");
  try {
    const updatedCompany = await Company.findByIdAndUpdate(
      req.query.companyId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCompany) {
      console.log("Rejecting request due to no company found!");
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(updatedCompany);
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
      console.error("Rejecting due to unknown error: " + error.name);
    }
  }
};

// Delete a company by ID
const deleteCompany = async (req, res) => {
  console.log("Delete Company called!");
  try {
    const companyId = req.query.id;
    const company = await Company.findById(companyId);
    if (!company) {
      console.log("Rejecting request due to no facility found!");
      return res.status(404).json({ message: "Company not found!" });
    }
    if (company.facilities.length > 0) {
      console.log(
        "Rejecting request due the company having active facilities!"
      );
      return res
        .status(400)
        .json({ message: "Cannot delete company with associated facilities!" });
    }
    await Company.findByIdAndDelete(companyId);
    const deleteCompanyFromUser = await User.updateMany(
      { company: companyId },
      { $set: { company: null } }
    );
    res.status(200).json({ message: `${companyId} deleted successfully!` });
  } catch (error) {
    console.error(
      "Error processing the last delete company call! See error below...\n" +
        error.message
    );
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createCompany,
  editCompany,
  getCompanies,
  deleteCompany,
  getFacilitiesByCompany,
  getCompanyById,
};
