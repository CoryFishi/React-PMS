require("dotenv").config();

const API_KEY = process.env.API_KEY;

const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  console.log(apiKey);
  if (!apiKey) {
    return res.status(401).json({ error: "Unauthorized: No API Key Provided" });
  }
  if (apiKey !== API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
  next();
};

module.exports = authenticateAPIKey;
