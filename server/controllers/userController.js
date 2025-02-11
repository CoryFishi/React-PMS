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
    const user = await User.findById(decoded._id);

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
    console.log(error);
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
    console.log(error);
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
  const users = await User.find({})
    .populate("company", "companyName")
    .sort({ displayName: 1 });
  res.status(200).json(users);
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

const getAdminDashboardData = async (req, res) => {
  try {
    const currentDate = new Date();
    const startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    ); // Start from two months ago

    // User counts
    const totalUsers = await User.countDocuments();
    const enabledUsers = await User.countDocuments({ status: "Enabled" });
    const disabledUsers = await User.countDocuments({ status: "Disabled" });

    // Company counts
    const totalCompanies = await Company.countDocuments();
    const enabledCompanies = await Company.countDocuments({
      status: "Enabled",
    });
    const disabledCompanies = await Company.countDocuments({
      status: "Disabled",
    });

    // Facility counts
    const totalFacilities = await StorageFacility.countDocuments();
    const enabledFacilities = await StorageFacility.countDocuments({
      status: "Enabled",
    });
    const pendingDeploymentFacilities = await StorageFacility.countDocuments({
      status: "Pending Deployment",
    });
    const maintenanceFacilities = await StorageFacility.countDocuments({
      status: "Maintenance",
    });
    const disabledFacilities = await StorageFacility.countDocuments({
      status: "Disabled",
    });

    // Unit counts
    const totalUnits = await StorageUnit.countDocuments();
    const rentedUnits = await StorageUnit.countDocuments({
      status: "Rented",
    });
    const delinquentUnits = await StorageUnit.countDocuments({
      status: "Delinquent",
    });
    const vacantUnits = await StorageUnit.countDocuments({
      status: "Vacant",
    });

    // Tenant counts
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({
      status: "Active",
    });
    const disabledTenants = await Tenant.countDocuments({
      status: "Disabled",
    });

    // Events count per month (for current and past 2 months)
    const eventCounts = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: currentDate }, // Filter for the last 3 months
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
      {
        $sort: { "_id.year": 1, "_id.month": 1 }, // Sort chronologically
      },
    ]);

    // Convert month number to month name
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
  getUsersByCompany,
  logoutUser,
  getAdminDashboardData,
};
