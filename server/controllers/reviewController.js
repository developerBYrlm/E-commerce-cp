import Review from "../models/Review.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listReviews = asyncHandler(async (req, res) => {
  const filter = {};
  for (const key of ["shop", "product", "service"]) if (req.query[key]) filter[key] = req.query[key];
  if (req.query.mine === "true") {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    if (req.user.role === "owner") filter.shop = { $in: await Shop.find({ owner: req.user.id }).distinct("_id") };
    else filter.author = req.user.id;
  }
  const items = await Review.find(filter)
    .populate("author", "name avatar email phone")
    .populate("shop", "name slug")
    .populate("product", "name")
    .populate("service", "name")
    .sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});

export const createReview = asyncHandler(async (req, res) => {
  if (!req.body.shop) return res.status(400).json({ message: "A shop is required for a review" });
  if (!Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 5) return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
  if (req.body.text !== undefined && (typeof req.body.text !== "string" || req.body.text.length > 2000)) return res.status(400).json({ message: "Review text must be 2,000 characters or fewer" });
  const shopExists = await Shop.exists({ _id: req.body.shop, status: "active" });
  if (!shopExists) return res.status(404).json({ message: "Shop not found" });
  if (req.body.product && req.body.service) return res.status(400).json({ message: "Review a shop, product, or service at a time" });
  if (req.body.product && !await Product.exists({ _id: req.body.product, shop: req.body.shop, status: "active" })) {
    return res.status(404).json({ message: "Product not found for this shop" });
  }
  if (req.body.service && !await Service.exists({ _id: req.body.service, shop: req.body.shop, status: "active" })) {
    return res.status(404).json({ message: "Service not found for this shop" });
  }
  const item = await Review.create({ shop: req.body.shop, product: req.body.product, service: req.body.service, rating: req.body.rating, text: req.body.text, author: req.user.id });
  const targetFilter = item.product ? { product: item.product } : item.service ? { service: item.service } : {};
  const stats = await Review.aggregate([
    { $match: { shop: item.shop, ...targetFilter } },
    { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    const targetModel = item.product ? Product : item.service ? Service : Shop;
    const targetId = item.product || item.service || item.shop;
    await targetModel.findByIdAndUpdate(targetId, { rating: stats[0].rating, reviewCount: stats[0].count });
  }
  const shop = await Shop.findById(item.shop).select("owner");
  const notification = await Notification.create({ recipient: shop.owner, type: "review", title: "New shop review", body: `${item.rating} star review`, resource: item._id });
  req.app.get("io")?.to(`user:${shop.owner}`).emit("notification:new", notification);
  res.status(201).json({ item });
});
