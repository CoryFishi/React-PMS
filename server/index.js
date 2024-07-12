const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { mongoose } = require("mongoose");
const cookieParser = require("cookie-parser");
const { exec } = require("child_process");
const app = express();

// databse connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Database connected"))
  .catch(() => console.log("🔴 Database not connected", err));

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", require("./routes/authRoutes"));

const port = process.env.PORT;
app.listen(port, () => console.log(`🟢 Server is runnin on port ${port}`));

const runDelinquency = () => {
  exec("node ./processes/delinquency.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    if (stdout) {
      console.log(`${stdout}`);
    }
    if (stderr) {
      console.error(`${stderr}`);
    }
  });
};

const runMonthly = () => {
  exec("node ./processes/monthly.js", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    if (stdout) {
      console.log(`${stdout}`);
    }
    if (stderr) {
      console.error(`${stderr}`);
    }
  });
};

// run delinquency script every 30 minutes
// This script turns tenants that have not paid their bill too delinquent
setInterval(runDelinquency, 30 * 60 * 1000);
// run monthly script every 30 minutes
// This script adds the tenants monthly rent to their balance
setInterval(runMonthly, 30 * 60 * 1000);
