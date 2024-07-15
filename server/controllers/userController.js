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
    console.log("User created id:" + user._id);

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
    // Check if passwords match
    const match = await comparePassword(password, user.password);
    if (match) {
      // Check if they have confirmed their account
      if (user.confirmed === false) {
        return res.json({
          error: "Please confirm your email",
        });
      }
      jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(user);
        }
      );
    }
    if (!match) {
      res.json({
        error: "Password does not match!",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// Get JWT Data
const getLoginData = (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
      if (err) throw err;
      res.status(200).json(user);
    });
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
};
