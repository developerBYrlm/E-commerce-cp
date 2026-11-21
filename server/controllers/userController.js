import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { sendAccountEmail } from "../utils/email.js";
import { isValidBangladeshLocation } from "../utils/bangladeshLocation.js";
import Category from "../models/Category.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "avatar", "location", "phone", "district", "subDistrict", "area", "address", "extendedAddress"];
  for (const key of allowed) if (req.body[key] !== undefined) req.user[key] = req.body[key];
  if (req.user.role === "owner" && ["phone", "address"].some((key) => req.body[key] !== undefined && !String(req.body[key]).trim())) {
    return res.status(400).json({ message: "Shop owner profile requires a primary phone and full address" });
  }
  if (["district", "subDistrict", "area"].some((key) => req.body[key] !== undefined) && !isValidBangladeshLocation(req.user)) {
    return res.status(400).json({ message: "Choose a valid Bangladesh district and sub-district, then enter your area" });
  }
  if (req.body.shopCategories !== undefined) {
    const categories = req.body.shopCategories;
    if (req.user.role !== "owner" || !Array.isArray(categories) || !categories.length || categories.length > 10 || categories.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "Choose between 1 and 10 valid business categories" });
    }
    const count = await Category.countDocuments({ _id: { $in: categories }, type: { $in: ["shop", "all"] } });
    if (count !== new Set(categories.map(String)).size) return res.status(400).json({ message: "Choose valid business categories" });
    req.user.shopCategories = [...new Set(categories)];
  }
  if (req.body.email !== undefined && req.body.email.toLowerCase().trim() !== req.user.email) {
    const email = req.body.email.toLowerCase().trim();
    if (await User.exists({ email, _id: { $ne: req.user._id } })) return res.status(409).json({ message: "An account with that email already exists" });
    req.user.email = email;
    req.user.isVerified = false;
    const rawToken = crypto.randomBytes(32).toString("hex");
    req.user.verificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const frontend = process.env.CLIENT_APP_URL || (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    try {
      await sendAccountEmail({ to: email, subject: "Verify your updated LocalSphere email", text: `Verify your email: ${frontend}/verify-email?token=${rawToken}` });
    } catch (error) {
      console.error("Profile email changed but verification email delivery failed:", error);
    }
  }
  await req.user.save();
  if (req.user.role === "owner" && req.body.name !== undefined) {
    await Shop.updateMany({ owner: req.user._id }, { $set: { ownerName: req.user.name } });
  }
  if (req.user.role === "owner" && req.body.shopCategories !== undefined) {
    await Shop.updateMany({ owner: req.user._id }, {
      $set: { categories: req.user.shopCategories, category: req.user.shopCategories[0] },
    });
  }
  res.json({ user: {
    id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role,
    avatar: req.user.avatar, isVerified: req.user.isVerified,
    following: req.user.following || [], followingServices: req.user.followingServices || [], wishlist: req.user.wishlist || [],
    phone: req.user.phone || "", district: req.user.district || "", subDistrict: req.user.subDistrict || "",
    area: req.user.area || "", address: req.user.address || "", extendedAddress: req.user.extendedAddress || "",
    shopCategories: req.user.shopCategories || [],
  } });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) {
    return res.status(400).json({ message: "New password must be between 10 and 128 characters" });
  }
  const user = await User.findById(req.user.id).select("+password");
  if (!user?.password || typeof currentPassword !== "string" || !(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: "Password updated successfully" });
});

export const followShop = asyncHandler(async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can follow shops" });
  }
  const shop = await Shop.findOne({ _id: req.params.shopId, status: "active" });
  if (!shop) return res.status(404).json({ message: "Shop not found" });
  if (!Array.isArray(req.user.following)) req.user.following = [];
  if (!Array.isArray(shop.followers)) shop.followers = [];
  const following = req.user.following.some((id) => id.equals(shop._id));
  if (following) {
    req.user.following.pull(shop._id);
    shop.followers.pull(req.user._id);
  } else {
    req.user.following.addToSet(shop._id);
    shop.followers.addToSet(req.user._id);
  }
  await Promise.all([req.user.save(), shop.save()]);
  const io = req.app.get("io");
  if (io && shop.owner) {
    io.to(`user:${shop.owner}`).emit("shop:followerUpdate", {
      shopId: String(shop._id),
      followerCount: shop.followers.length,
      action: following ? "unfollow" : "follow",
      userId: String(req.user._id),
    });
  }
  res.json({ following: !following, followerCount: shop.followers.length });
});

export const followService = asyncHandler(async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can follow services" });
  }
  const service = await Service.findOne({ _id: req.params.serviceId, status: "active" }).populate("shop");
  if (!service) return res.status(404).json({ message: "Service not found" });
  if (!Array.isArray(req.user.followingServices)) req.user.followingServices = [];
  if (!Array.isArray(service.followers)) service.followers = [];
  const following = req.user.followingServices.some((id) => id.equals(service._id));
  if (following) {
    req.user.followingServices.pull(service._id);
    service.followers.pull(req.user._id);
  } else {
    req.user.followingServices.addToSet(service._id);
    service.followers.addToSet(req.user._id);
  }
  await Promise.all([req.user.save(), service.save()]);
  const io = req.app.get("io");
  const ownerId = service.owner || service.shop?.owner;
  if (io && ownerId) {
    io.to(`user:${ownerId}`).emit("service:followerUpdate", {
      serviceId: String(service._id),
      followerCount: service.followers.length,
      action: following ? "unfollow" : "follow",
      userId: String(req.user._id),
    });
  }
  res.json({ following: !following, followerCount: service.followers.length });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: "following",
      match: { status: "active" },
      select: "name slug logo coverImage description followers rating reviewCount shopType district subDistrict area address",
    })
    .populate({
      path: "followingServices",
      match: { status: "active" },
      select: "name price isNegotiable images description followers rating reviewCount shop",
      populate: { path: "shop", select: "name slug logo" },
    });
  res.json({
    shops: user?.following || [],
    services: user?.followingServices || [],
    totalCount: (user?.following?.length || 0) + (user?.followingServices?.length || 0),
  });
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const inList = req.user.wishlist.some((id) => id.equals(productId));
  if (!inList && !await Product.exists({ _id: productId, status: "active" })) return res.status(404).json({ message: "Product not found" });
  if (inList) req.user.wishlist.pull(productId);
  else req.user.wishlist.addToSet(productId);
  await req.user.save();
  res.json({ saved: !inList });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("wishlist").populate({
    path: "wishlist",
    match: { status: "active" },
    select: "name price discount images stock shop",
    populate: { path: "shop", select: "name slug" },
  });
  res.json({ items: user.wishlist });
});

export const getDiscoveryHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("searchHistory recentlyViewed").populate({
    path: "recentlyViewed",
    match: { status: "active" },
    select: "name price discountPrice images shop category",
    populate: [{ path: "shop", select: "name slug area subDistrict district" }, { path: "category", select: "name" }],
  });
  res.json({ searchHistory: user.searchHistory, recentlyViewed: user.recentlyViewed });
});

export const adminUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -verificationToken -resetPasswordToken").sort({ createdAt: -1 }).limit(100);
  res.json({ items: users });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  if (!["active", "suspended"].includes(req.body.status)) return res.status(400).json({ message: "Status must be active or suspended" });
  const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).select("-password -verificationToken -resetPasswordToken");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});
