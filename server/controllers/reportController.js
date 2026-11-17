import mongoose from "mongoose";
import Report from "../models/Report.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReport = asyncHandler(async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Only customers can submit reports" });
  }
  const { targetType, target, reason } = req.body;
  if (!["Shop", "Product", "Service"].includes(targetType) || !mongoose.isValidObjectId(target)) {
    return res.status(400).json({ message: "Choose a valid shop, product, or service to report" });
  }
  if (typeof reason !== "string" || reason.trim().length < 5 || reason.trim().length > 500) {
    return res.status(400).json({ message: "Explain the issue in 5 to 500 characters" });
  }
  let listing;
  let shop;
  if (targetType === "Shop") {
    listing = await Shop.findOne({ _id: target, status: "active" });
    shop = listing;
  } else if (targetType === "Product") {
    listing = await Product.findOne({ _id: target, status: "active" });
    if (listing) shop = await Shop.findById(listing.shop).select("owner");
  } else if (targetType === "Service") {
    listing = await Service.findOne({ _id: target, status: "active" });
    if (listing) shop = await Shop.findById(listing.shop).select("owner");
  }
  if (!listing) return res.status(404).json({ message: "The reported listing was not found" });
  if (String(shop?.owner) === String(req.user.id)) return res.status(403).json({ message: "You cannot report your own business or listing" });
  if (await Report.exists({ reporter: req.user.id, targetType, target })) {
    return res.status(409).json({ message: "You have already reported this listing" });
  }
  let report;
  try {
    report = await Report.create({ reporter: req.user.id, targetType, target, reason: reason.trim() });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You have already reported this listing" });
    throw error;
  }
  res.status(201).json({ report });
});

export const listReports = asyncHandler(async (_req, res) => {
  const items = await Report.find().populate("reporter", "name email").populate("target").sort({ createdAt: -1 }).limit(200);
  res.json({ items });
});

export const updateReport = asyncHandler(async (req, res) => {
  if (!["reviewed", "dismissed"].includes(req.body.status)) return res.status(400).json({ message: "Status must be reviewed or dismissed" });
  const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true, runValidators: true });
  if (!report) return res.status(404).json({ message: "Report not found" });
  res.json({ report });
});
