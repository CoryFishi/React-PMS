// Imports
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Password hasher
const {
  hashPassword,
  comparePassword,
  passwordValidator,
} = require("../helpers/password");

// Schemas
const User = require("../models/user");
const StorageFacility = require("../models/facility");
const Company = require("../models/company");
const Event = require("../models/event");
const StorageUnit = require("../models/unit");
const Tenant = require("../models/tenant");

// .env imports
require("dotenv").config();

// Create User
const createUser = async (req, res) => {
  try {
    const {
      displayName,
      name,
      email,
      address,
      role,
      company,
      facilities,
      phone,
      createdBy,
    } = req.body;

    // Check for account if not a system account
    if (
      (role === "Company_Admin" && !company) ||
      (role === "Company_User" && !company)
    ) {
      return res.status(400).json({
        error: "Please assign a company to this user!",
      });
    }
    if (role === "Company_User" && Object.keys(facilities).length === 0) {
      return res.status(400).json({
        error: "Please assign a facility to this user!",
      });
    }
    if (!role) {
      return res.status(400).json({
        error: "Please assign a role to this user!",
      });
    }

    // Create user in database
    const user = await User.create({
      displayName,
      name,
      email,
      address,
      company,
      facilities,
      role,
      phone,
      createdBy,
    });
    const userWithCompany = await User.findById(user._id).populate(
      "company",
      "companyName"
    );
    // Send confirmation email
    const subject = "Confirm your SafePhish account";
    const to = email;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirm Your Account</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border: 1px solid #dddddd;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    background: #007BFF;
                    color: white;
                    padding: 10px;
                }
                .content {
                    padding: 20px;
                    text-align: center;
                    line-height: 1.6;
                }
                .footer {
                    font-size: 12px;
                    text-align: center;
                    padding: 20px;
                    color: #888888;
                }
                .button {
                    display: block;
                    width: 200px;
                    margin: 20px auto;
                    padding: 10px;
                    background-color: #007BFF;
                    color: white;
                    text-decoration: none;
                    text-align: center;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Welcome to SafePhish!</h1>
                </div>
                <div class="content">
                    <p>Hello ${name},</p>
                    <p>Thank you for registering with us. Please confirm your email address by clicking the button below:</p>
                    <a href="http://${
                      req.headers.host
                    }/users/confirm/${encodeURIComponent(
      user._id.toString()
    )}" class="button">Confirm Email</a>
                    <p>If the button does not work, please paste the following link into your browser:</p>
                    <p><a href="http://${
                      req.headers.host
                    }/users/confirm/${encodeURIComponent(
      user._id.toString()
    )}">http://${req.headers.host}/users/confirm/${encodeURIComponent(
      user._id.toString()
    )}</a></p>
                    <p>Thank you for joining us and welcome aboard!</p>
                </div>
                <div class="footer">
                    <p>If you have any questions, feel free to contact us at support@safephish.com.</p>
                    <p>© 2024 SafePhish. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    const mailOptions = {
      from: {
        name: "SafePhish",
        address: process.env.EMAIL,
      },
      to,
      subject,
      html: htmlContent,
    };
    try {
      transporter.sendMail(mailOptions);
    } catch (error) {
      res.status(500).send("Failed to send confirmation email");
    }
    return res.status(201).json(userWithCompany);
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorKey = Object.keys(error.errors)[0];
      console.error(
        "Rejecting due to validation error: " +
          error.errors[firstErrorKey].message
      );
      res.status(500).send({ error: error.errors[firstErrorKey].message });
    } else {
      res.status(500).send({ error: error.message });
      console.error("Rejecting due to unknown error: " + error.message);
    }
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: "No user found",
      });
    }
    if (!user.password) {
      return res.status(401).json({
        error: "Password does not match!",
      });
    }
    if (!user.confirmed) {
      return res.status(403).json({ error: "Please confirm your email" });
    }
    if (user.status === "Disabled") {
      return res.status(403).json({
        error: "Your account has been disabled. Please contact support.",
      });
    }

    // Check if passwords match
    const match = await comparePassword(password, user.password);
    if (match) {
      // Check if they have confirmed their account
      if (user.confirmed === false) {
        return res.status(403).json({
          error: "Please confirm your email",
        });
      }

      // Generate JWT
      jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;

          res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
          });

          // Send the user data as a response
          res.status(200).json(user);
        }
      );
    } else {
      res.status(401).json({
        error: "Password does not match!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get JWT Data
const getLoginData = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify the JWT and extract the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded._id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Use `findById` to fetch the user by the ID from the decoded JWT payload
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Process JWT Data
const processJWTData = async (req, res) => {
  const id = req.query.id;
  try {
    if (!id) {
      res.status(404).send({ message: "User not found" });
    }
    const user = await User.findById({ _id: id });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
  }
};

const logoutUser = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// Delete User
const deleteUser = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.json({
      error: "id is required",
    });
  }
  try {
    const result = await User.findByIdAndDelete(userId);
    if (result) {
      res.status(200).send({ message: userId + " deleted" });
    } else {
      res.status(404).send({ message: "User not found" });
    }
    await StorageFacility.updateMany(
      { manager: userId },
      { $pull: { manager: userId } }
    );
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error deleting user", error: error.message });
  }
};

// Edit User
const editUser = async (req, res) => {
  const id = req.body.userId;
  const name = req.body.name;
  const displayName = req.body.displayName;
  const role = req.body.role;
  const confirmed = req.body.confirmed;
  const facilities = req.body.facilities;
  const company = req.body.company;
  const status = req.body.status;
  const address = req.body.address;
  const phone = req.body.phone;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        displayName,
        role,
        confirmed,
        facilities,
        company,
        status,
        address,
        phone,
      },
      { new: true }
    ).populate("company", "companyName");

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send(user);
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

// Send User confirmation email
const sendUserConfirmationEmail = async (req, res) => {
  const userId = req.body.userId;

  var user = [];
  try {
    user = await User.findByIdAndUpdate(
      userId,
      {
        confirmed: false,
      },
      { new: true }
    );
    if (!user) {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ message: error });
  }
  // Send confirmation email
  const subject = "Confirm your SafePhish account";
  const to = user.email;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  });
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Confirm Your Account</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  background-color: #ffffff;
                  border: 1px solid #dddddd;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  background: #007BFF;
                  color: white;
                  padding: 10px;
              }
              .content {
                  padding: 20px;
                  text-align: center;
                  line-height: 1.6;
              }
              .footer {
                  font-size: 12px;
                  text-align: center;
                  padding: 20px;
                  color: #888888;
              }
              .button {
                  display: block;
                  width: 200px;
                  margin: 20px auto;
                  padding: 10px;
                  background-color: #007BFF;
                  color: white;
                  text-decoration: none;
                  text-align: center;
                  border-radius: 5px;
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>Welcome to SafePhish!</h1>
              </div>
              <div class="content">
                  <p>Hello ${user.name},</p>
                  <p>Thank you for registering with us. Please confirm your email address by clicking the button below:</p>
                  <a href="http://${
                    req.headers.host
                  }/users/confirm/${encodeURIComponent(
    user._id.toString()
  )}" class="button">Confirm Email</a>
                  <p>If the button does not work, please paste the following link into your browser:</p>
                  <p><a href="http://${
                    req.headers.host
                  }/users/confirm/${encodeURIComponent(
    user._id.toString()
  )}">http://${req.headers.host}/users/confirm/${encodeURIComponent(
    user._id.toString()
  )}</a></p>
                  <p>Thank you for joining us and welcome aboard!</p>
              </div>
              <div class="footer">
                  <p>If you have any questions, feel free to contact us at support@safephish.com.</p>
                  <p>© 2024 SafePhish. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
      `;
  const mailOptions = {
    from: {
      name: "SafePhish",
      address: process.env.EMAIL,
    },
    to,
    subject,
    html: htmlContent,
  };
  try {
    transporter.sendMail(mailOptions);
  } catch (error) {
    res.status(500).send({ message: "Failed to send confirmation email" });
  }

  res.status(200).send({ message: "Email sent to " + to });
};

// User confirmation email
const userConfirmationEmail = async (req, res) => {
  const userId = req.params.userId;
  const redirectUrl = `http://localhost:5173/register/${userId}`;
  try {
    const userExist = await User.findOne({ _id: userId });
    if (!userExist) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).redirect(redirectUrl);
  } catch (error) {
    console.error(error);
  }
};

// Set User Password after email confirmation
const setUserPassword = async (req, res) => {
  try {
    const id = req.params.userId;
    const password = req.body.password;
    const passwordError = passwordValidator(password);
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
      });
    }

    const hashedPassword = await hashPassword(password);
    const existUser = await User.findById(id);
    if (!existUser) {
      return res.status(404).send({ message: "User not found" });
    }
    if (existUser.confirmed === true) {
      return res.status(400).send({ message: "User already confirmed!" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        confirmed: true,
      },
      { new: true }
    );

    res.status(200).send(user);
  } catch (error) {
    console.error(error);
  }
};

// Get Users by Company
const getUsersByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const user = await User.find({ company: companyId });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// Get all Users
const getUsers = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    let users;

    if (requestingUser.role === "System_Admin") {
      // Return all users
      users = await User.find({})
        .populate("company", "companyName")
        .sort({ displayName: 1 });
    } else if (requestingUser.role === "Company_Admin") {
      // Return users from the same company
      users = await User.find({ company: requestingUser.company })
        .populate("company", "companyName")
        .sort({ displayName: 1 });
    } else {
      // Return only the user's own info
      users = [requestingUser];
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Get user by Id
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentDate = new Date();
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    );

    // Helper to scope queries
    const companyFilter = user.role === "System_Admin" ? [] : user.company;

    // Users
    const totalUsers = await User.countDocuments({ ...companyFilter });
    const enabledUsers = await User.countDocuments({
      ...companyFilter,
      status: "Enabled",
    });
    const disabledUsers = await User.countDocuments({
      ...companyFilter,
      status: "Disabled",
    });

    // Companies
    const totalCompanies = await Company.countDocuments({ ...companyFilter });
    const enabledCompanies = await Company.countDocuments({
      status: "Enabled",
      ...companyFilter,
    });
    const disabledCompanies = await Company.countDocuments({
      status: "Disabled",
      ...companyFilter,
    });

    // Facilities
    const totalFacilities = await StorageFacility.countDocuments({
      ...companyFilter,
    });
    const enabledFacilities = await StorageFacility.countDocuments({
      ...companyFilter,
      status: "Enabled",
    });
    const pendingDeploymentFacilities = await StorageFacility.countDocuments({
      ...companyFilter,
      status: "Pending Deployment",
    });
    const maintenanceFacilities = await StorageFacility.countDocuments({
      ...companyFilter,
      status: "Maintenance",
    });
    const disabledFacilities = await StorageFacility.countDocuments({
      ...companyFilter,
      status: "Disabled",
    });

    // Units
    const totalUnits = await StorageUnit.countDocuments({ ...companyFilter });
    const rentedUnits = await StorageUnit.countDocuments({
      ...companyFilter,
      status: "Rented",
    });
    const delinquentUnits = await StorageUnit.countDocuments({
      ...companyFilter,
      status: "Delinquent",
    });
    const vacantUnits = await StorageUnit.countDocuments({
      ...companyFilter,
      status: "Vacant",
    });

    // Tenants
    const totalTenants = await Tenant.countDocuments({ ...companyFilter });
    const activeTenants = await Tenant.countDocuments({
      ...companyFilter,
      status: "Active",
    });
    const disabledTenants = await Tenant.countDocuments({
      ...companyFilter,
      status: "Disabled",
    });

    // Events
    const eventCounts = await Event.aggregate([
      {
        $match: {
          ...companyFilter,
          createdAt: { $gte: startDate, $lte: currentDate },
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
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    res.status(200).json({
      users: {
        total: totalUsers,
        enabled: enabledUsers,
        disabled: disabledUsers,
      },
      companies: {
        total: totalCompanies,
        enabled: enabledCompanies,
        disabled: disabledCompanies,
      },
      facilities: {
        total: totalFacilities,
        enabled: enabledFacilities,
        pendingDeployment: pendingDeploymentFacilities,
        maintenance: maintenanceFacilities,
        disabled: disabledFacilities,
      },
      units: {
        total: totalUnits,
        rented: rentedUnits,
        delinquent: delinquentUnits,
        vacant: vacantUnits,
      },
      tenants: {
        total: totalTenants,
        active: activeTenants,
        disabled: disabledTenants,
      },
      events: eventCounts.map((event) => ({
        month: monthNames[event._id.month - 1],
        count: event.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
};

const selectFacility = async (req, res) => {
  const { userId, facilityId } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { selectedFacility: facilityId },
      { new: true }
    ).populate("selectedFacility");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Facility selected", user });
  } catch (error) {
    console.error("Error selecting facility:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const clearSelectedFacility = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { selectedFacility: null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Selected facility cleared", user });
  } catch (error) {
    console.error("Error clearing facility:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const rentalCenterCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    const company = await Company.findById(companyId).select(
      "companyName logo address"
    );

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.status(200).json({
      companyName: company.companyName,
      logo: company.logo,
      address: company.address,
    });
  } catch (error) {
    console.error("Error fetching company data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const rentalCenterFacilities = async (req, res) => {
  const { companyId } = req.params;

  try {
    const facilities = await StorageFacility.find({
      company: companyId,
      status: "Enabled",
    }).select("facilityName address");

    const results = await Promise.all(
      facilities.map(async (facility) => {
        const vacantUnits = await StorageUnit.find({
          facility: facility._id,
          status: "Vacant",
        }).select(
          "specifications paymentInfo.pricePerMonth unitNumber unitType availability tags amenities condition"
        );

        return {
          _id: facility._id,
          facilityName: facility.facilityName,
          address: facility.address,
          units: vacantUnits,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching rental center facilities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const rentalCenterUnits = async (req, res) => {
  const { facilityId } = req.params;

  try {
    const units = await StorageUnit.find({
      facility: facilityId,
      status: "Vacant",
    }).select(
      "specifications paymentInfo.pricePerMonth unitNumber unitType availability tags amenities condition"
    );

    res.status(200).json(units);
  } catch (error) {
    console.error("Error fetching units for facility:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const rentalCenterConfig = async (req, res) => {
  const { facilityId, companyId, unitId } = req.params;

  try {
    const facility = await StorageFacility.findById(facilityId).select(
      "facilityName address status"
    );

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    const unit = await StorageUnit.findOne({
      _id: unitId,
      facility: facilityId,
      status: "Vacant",
    }).select(
      "specifications paymentInfo.pricePerMonth unitNumber unitType availability tags amenities condition"
    );

    if (!unit) {
      return res.status(404).json({ error: "Unit not found or not vacant" });
    }

    const company = await Company.findById(companyId).select("insurancePlans");

    const activeInsurancePlans =
      company?.insurancePlans?.filter((plan) => plan.active) || [];

    res.status(200).json({
      facility,
      unit,
      insurancePlans: activeInsurancePlans,
    });
  } catch (error) {
    console.error("Error fetching rental center config:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Exports
module.exports = {
  createUser,
  getUsers,
  deleteUser,
  editUser,
  userConfirmationEmail,
  getLoginData,
  loginUser,
  processJWTData,
  sendUserConfirmationEmail,
  getUserById,
  setUserPassword,
  rentalCenterConfig,
  getUsersByCompany,
  logoutUser,
  getDashboardData,
  selectFacility,
  clearSelectedFacility,
  rentalCenterCompany,
  rentalCenterFacilities,
  rentalCenterUnits,
};
