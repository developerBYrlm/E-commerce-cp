import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session is invalid or expired" });
  }
  const user = await User.findById(payload.sub).select("-password -verificationToken -resetPasswordToken");
  if (!user || user.status !== "active") return res.status(401).json({ message: "Account unavailable" });
  req.user = user;
  next();
});

export async function optionalAuth(req, _res, next) {
  const token = req.cookies.token || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.sub).select("-password -verificationToken -resetPasswordToken");
  } catch {
    req.user = null;
  }
  next();
}

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission to do this" });
  next();
};
