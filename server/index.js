const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import CORS
require("dotenv").config();

const app = express();

// ✅ Enable CORS globally
app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend requests
    credentials: true, // Allow cookies and auth headers
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

// Logging of incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Import & Use Routes
app.use("/companies", require("./routes/companyRoutes"));
app.use("/facilities", require("./routes/facilityRoutes"));
app.use("/tenants", require("./routes/tenantRoutes"));
app.use("/events", require("./routes/eventRoutes"));
app.use("/payments", require("./routes/paymentRoutes"));
app.use("/", require("./routes/userRoutes"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Database connected");

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🟢 Server is running on port ${port}`));
  })
  .catch((err) => {
    console.error("🔴 Database not connected:", err);
    process.exit(1);
  });

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
