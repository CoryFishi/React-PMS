import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";

import companyRoutes from "./routes/companyRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import rentalRoutes from "./routes/rentalRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import getEnvelopesApi from "./services/docusignClient.js";

export function buildApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  );

  // Webhooks must consume raw body for HMAC verification — mount BEFORE express.json()
  app.use("/webhooks", webhookRoutes);

  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, _res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  });

  app.use("/admin", adminRoutes);
  app.use("/companies", companyRoutes);
  app.use("/facilities", facilityRoutes);
  app.use("/tenants", tenantRoutes);
  app.use("/events", eventRoutes);
  app.use("/payments", paymentRoutes);
  app.use("/rental", rentalRoutes);
  app.use("/", userRoutes);

  app.get("/docusign/ping", async (_req, res) => {
    try {
      const { accountId } = await getEnvelopesApi();
      res.json({ ok: true, accountId });
    } catch (e) {
      console.error(e);
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.get("/docusign/envelopes/:envelopeId", async (req, res) => {
    try {
      const { envelopesApi, accountId } = await getEnvelopesApi();
      const env = await envelopesApi.getEnvelope(accountId, req.params.envelopeId, null);
      res.json(env);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return app;
}
