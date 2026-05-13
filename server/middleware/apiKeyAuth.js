import crypto from "crypto";

const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const expected = process.env.API_KEY;

  if (!apiKey || !expected || apiKey.length !== expected.length) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const ok = crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
  if (!ok) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  return next();
};

export default authenticateAPIKey;
