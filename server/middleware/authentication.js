import jwt from "jsonwebtoken";

// This function checks if the user is authenticated by verifying the JWT token.
// If the token is valid, it decodes the user information and attaches it to the request object.
// Middleware to protect routes
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
};

export default authenticate;
