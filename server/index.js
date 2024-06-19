const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { mongoose } = require("mongoose");
const cookieParser = require("cookie-parser");
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
