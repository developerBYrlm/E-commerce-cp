import crypto from "node:crypto";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/token.js";
import { sendAccountEmail } from "../utils/email.js";
import Category from "../models/Category.js";
import { isValidBangladeshLocation } from "../utils/bangladeshLocation.js";

const clientAppUrl = process.env.CLIENT_APP_URL || (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

function setSession(res, user) {
  const token = signToken(user);
  res.cookie("token", token, {
    httpOnly: true, secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}
function publicUser(user) {
  return {
    id: user.id, _id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar,
    isVerified: user.isVerified, subscriptionPlan: user.subscriptionPlan || "starter", following: user.following || [], followingServices: user.followingServices || [], wishlist: user.wishlist || [],
    phone: user.phone || "", district: user.district || "", subDistrict: user.subDistrict || "",
    area: user.area || "", address: user.address || "", extendedAddress: user.extendedAddress || "",
    shopCategories: user.shopCategories || [],
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  if (role && !["customer", "owner"].includes(role)) return res.status(403).json({ message: "Choose a supported account type" });
  if (!isValidBangladeshLocation(req.body)) return res.status(400).json({ message: "Choose a valid Bangladesh district and sub-district, then enter your area" });
  if (role === "owner" && (typeof req.body.phone !== "string" || !req.body.phone.trim() || typeof req.body.address !== "string" || !req.body.address.trim())) {
    return res.status(400).json({ message: "Shop owner accounts need a primary phone number and full address" });
  }
  const shopCategories = req.body.shopCategories;
  if (role === "owner" && (!Array.isArray(shopCategories) || !shopCategories.length || shopCategories.length > 10)) {
    return res.status(400).json({ message: "Shop owner accounts must select between 1 and 10 business categories" });
  }
  if (role === "owner") {
    if (shopCategories.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "Choose valid business categories" });
    const validCategories = await Category.countDocuments({ _id: { $in: shopCategories }, type: { $in: ["shop", "all"] } });
    if (validCategories !== new Set(shopCategories.map(String)).size) return res.status(400).json({ message: "Choose valid business categories" });
  }
  if (await User.exists({ email })) return res.status(409).json({ message: "An account with that email already exists" });
  const rawToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({
    name, email, password, role,
    phone: req.body.phone || "",
    district: req.body.district,
    subDistrict: req.body.subDistrict,
    area: req.body.area.trim(),
    address: req.body.address || "",
    extendedAddress: req.body.extendedAddress || "",
    shopCategories: role === "owner" ? [...new Set(shopCategories)] : [],
    verificationToken: crypto.createHash("sha256").update(rawToken).digest("hex"),
  });
  const link = `${clientAppUrl}/verify-email?token=${rawToken}`;
  try {
    await sendAccountEmail({ to: user.email, subject: "Verify your LocalSphere account", text: `Verify your email: ${link}` });
  } catch (error) {
    console.error("Account created but verification email delivery failed:", error);
  }
  res.status(201).json({ success: true, message: "Account created successfully. Please sign in." });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: "Invalid email or password" });
  if (user.status !== "active") return res.status(403).json({ message: "This account is unavailable" });
  setSession(res, user);
  res.json({ user: publicUser(user) });
});

export const logout = (_req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.COOKIE_SECURE === "true", sameSite: "lax" });
  res.json({ message: "Signed out" });
};

export const me = (req, res) => res.json({ user: publicUser(req.user) });

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = crypto.createHash("sha256").update(req.body.token || "").digest("hex");
  const user = await User.findOneAndUpdate({ verificationToken: token }, { $set: { isVerified: true }, $unset: { verificationToken: 1 } }, { new: true });
  if (!user) return res.status(400).json({ message: "Verification link is invalid or has expired" });
  res.json({ message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const link = `${clientAppUrl}/reset-password?token=${rawToken}`;
    try {
      await sendAccountEmail({ to: user.email, subject: "Reset your LocalSphere password", text: `Reset your password within one hour: ${link}` });
    } catch (error) {
      console.error("Password reset requested but email delivery failed:", error);
    }
  }
  res.json({ message: "If an account exists for that email, password reset instructions have been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = crypto.createHash("sha256").update(req.body.token || "").digest("hex");
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }).select("+password");
  if (!user) return res.status(400).json({ message: "Password reset link is invalid or has expired" });
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Password updated. You can now sign in." });
});

export const googleLogin = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google sign-in is not configured" });
  const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
  const profile = ticket.getPayload();
  if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: "A verified Google account is required" });
  const email = profile.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ name: profile.name || email, email, avatar: profile.picture, isVerified: true });
  else if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }
  if (user.status !== "active") return res.status(403).json({ message: "This account is unavailable" });
  setSession(res, user);
  res.json({ user: publicUser(user) });
});
