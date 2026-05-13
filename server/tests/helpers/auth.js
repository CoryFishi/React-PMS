import jwt from "jsonwebtoken";

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h", ...options });
}

export function cookieFor(payload, options = {}) {
  return `token=${signJwt(payload, options)}`;
}
