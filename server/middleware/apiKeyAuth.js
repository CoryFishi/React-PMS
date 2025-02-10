require("dotenv").config();

const API_KEY = process.env.API_KEY;

const authenticateAPIKey = (req, res, next) => {
  console.log(req.headers["x-api-key"]);
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res
      .status(401)
      .json({ message: "Unauthorized: No API Key Provided" });
  }
  if (apiKey !== API_KEY) {
    return res.status(403).json({ message: "Forbidden: Invalid API Key" });
  }
  next();
};

module.exports = authenticateAPIKey;
