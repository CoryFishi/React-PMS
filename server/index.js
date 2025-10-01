import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import getEnvelopesApi from "./services/docusignClient.js";
import dotenv from "dotenv";

import companyRoutes from "./routes/companyRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
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
app.use("/companies", companyRoutes);
app.use("/facilities", facilityRoutes);
app.use("/tenants", tenantRoutes);
app.use("/events", eventRoutes);
app.use("/payments", paymentRoutes);
app.use("/rental", rentalRoutes);
app.use("/", userRoutes);

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

// Example health route to verify auth works
app.get("/docusign/ping", async (req, res) => {
  try {
    const { accountId } = await getEnvelopesApi();
    res.json({ ok: true, accountId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Example: get envelope status (quick test)
app.get("/docusign/envelopes/:envelopeId", async (req, res) => {
  try {
    const { envelopesApi, accountId } = await getEnvelopesApi();
    const env = await envelopesApi.getEnvelope(
      accountId,
      req.params.envelopeId,
      null
    );
    res.json(env);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
