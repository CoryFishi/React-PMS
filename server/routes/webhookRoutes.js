import express from "express";
import verifyDocusignHmac from "../middleware/docusignHmac.js";
import * as webhookController from "../controllers/webhookController.js";

const router = express.Router();

router.post(
  "/docusign",
  express.raw({ type: "application/json", limit: "1mb" }),
  verifyDocusignHmac,
  webhookController.docusignEnvelopeEvent
);

export default router;
