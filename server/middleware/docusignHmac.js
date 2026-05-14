import crypto from "crypto";

const verifyDocusignHmac = (req, res, next) => {
  const key = process.env.DS_CONNECT_HMAC_KEY;
  if (!key) {
    console.error("[docusignHmac] DS_CONNECT_HMAC_KEY is not set; rejecting webhook");
    return res.status(503).json({ error: "Webhook auth not configured" });
  }

  const received = req.headers["x-docusign-signature-1"];
  if (!received) {
    return res.status(401).json({ error: "Missing signature" });
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
  const expected = crypto.createHmac("sha256", key).update(rawBody).digest("base64");

  const receivedBuf = Buffer.from(received);
  const expectedBuf = Buffer.from(expected);
  if (receivedBuf.length !== expectedBuf.length) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  if (!crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  try {
    req.body = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch (parseErr) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  return next();
};

export default verifyDocusignHmac;
