import { verifyAccess } from "../utils/jwt.js";

export function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}
