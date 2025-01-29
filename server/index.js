const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { mongoose } = require("mongoose");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const app = express();

const allowedOrigins = [
  "https://front-34ee.onrender.com", // Deployed frontend URL
  "https://localhost:5173", // Local development URL
];

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Database connected");

    // middleware
    app.use(express.json());
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: false }));

    app.use("/", require("./routes/authRoutes"));

    const port = process.env.PORT;
    app.listen(port, () => console.log(`🟢 Server is running on port ${port}`));
  })
  .catch((err) => console.log("🔴 Database not connected:", err));

// const runDelinquency = () => {
//   exec("node ./processes/delinquency.js", (error, stdout, stderr) => {
//     if (error) {
//       console.error(`exec error: ${error}`);
//       return;
//     }
//     if (stdout) {
//       console.log(`${stdout}`);
//     }
//     if (stderr) {
//       console.error(`${stderr}`);
//     }
//   });
// };

// const runMonthly = () => {
//   exec("node ./processes/monthly.js", (error, stdout, stderr) => {
//     if (error) {
//       console.error(`exec error: ${error}`);
//       return;
//     }
//     if (stdout) {
//       console.log(`${stdout}`);
//     }
//     if (stderr) {
//       console.error(`${stderr}`);
//     }
//   });
// };

// run delinquency script every 60 minutes
// This script turns tenants that have not paid their bill too delinquent
// setInterval(runDelinquency, 60 * 60 * 1000);
// run monthly script every 60 minutes
// This script adds the tenants monthly rent to their balance
// setInterval(runMonthly, 60 * 60 * 1000);
