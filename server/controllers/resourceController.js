import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import Shop from "../models/Shop.js";
import Category from "../models/Category.js";
import { isValidBangladeshLocation } from "../utils/bangladeshLocation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function resourceController(Model, { ownerField, populate = "", searchable = ["name", "title", "body"], allowCreate = true } = {}) {
  const scopedFilter = (req) => {
    if (!req.user || req.user.role !== "owner" || !ownerField) return {};
    if (req.method === "GET" && req.query.mine !== "true" && req.query.mine !== "1" && req.query.scope !== "mine") {
      return {};
    }
    if (ownerField === "shop") return { shop: { $in: req.user.shopIds || [] } };
    return { [ownerField]: req.user.id };
  };
  const populateShops = async (req, next) => {
    if (req.user?.role === "owner" && ownerField === "shop") {
      const shops = await Shop.find({ owner: req.user.id }).select("_id");
      req.user.shopIds = shops.map((shop) => shop._id);
    }
    return next();
  };
  return {
    list: asyncHandler(async (req, res) => {
      await populateShops(req, (error) => { if (error) throw error; });
      const isMineQuery = req.query.mine === "true" || req.query.mine === "1" || req.query.scope === "mine";
      const filter = { ...scopedFilter(req) };
      if (!isMineQuery) {
        if (Model.modelName === "Shop") filter.status = "active";
        if (["Product", "Service"].includes(Model.modelName)) {
          filter.status = "active";
          const activeShopIds = await Shop.find({ status: "active" }).distinct("_id");
          filter.$and = [...(filter.$and || []), { shop: { $in: activeShopIds } }];
        }
      }
      if (req.query.shop && mongoose.isValidObjectId(req.query.shop)) filter.shop = req.query.shop;
      if (req.query.shopType && ["product", "service"].includes(req.query.shopType)) filter.shopType = req.query.shopType;
      if (req.query.category && mongoose.isValidObjectId(req.query.category)) filter.category = req.query.category;
      if (req.query.district) filter.district = new RegExp(`^${String(req.query.district).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      if (req.query.subDistrict) filter.subDistrict = new RegExp(`^${String(req.query.subDistrict).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      if (req.query.type && Model.modelName === "Category" && ["shop", "product", "service", "all"].includes(req.query.type)) {
        filter.type = { $in: [req.query.type, "all"] };
      }
      if (req.query.status && ["owner", "admin"].includes(req.user?.role) && isMineQuery) filter.status = req.query.status;
      if (req.query.q) {
        const qClean = String(req.query.q).trim().slice(0, 100);
        if (qClean) {
          const escaped = qClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escaped, "i");
          if (["Product", "Service"].includes(Model.modelName)) {
            filter.$or = [
              { name: regex },
              { keywords: regex },
              { description: regex },
            ];
          } else if (Model.modelName === "Shop") {
            filter.$or = [
              { name: regex },
              { description: regex },
              { area: regex },
              { district: regex },
            ];
          } else {
            filter.$text = { $search: qClean };
          }
        }
      }
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
      const sort = req.query.trending === "true" && ["Product", "Service"].includes(Model.modelName)
        ? { views: -1, rating: -1, createdAt: -1 }
        : req.query.popular === "true" && Model.modelName === "Shop"
          ? { rating: -1, reviewCount: -1, createdAt: -1 }
          : { createdAt: -1 };
      const [items, total] = await Promise.all([
        Model.find(filter).populate(populate).sort(sort).skip((page - 1) * limit).limit(limit),
        Model.countDocuments(filter),
      ]);
      res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }),
    get: asyncHandler(async (req, res) => {
      await populateShops(req, (error) => { if (error) throw error; });
      const isObjectId = mongoose.isValidObjectId(req.params.id);
      let identifier;
      if (Model.modelName === "Shop") {
        identifier = isObjectId ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] } : { slug: req.params.id };
      } else if (Model.modelName === "Category") {
        identifier = isObjectId ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] } : { slug: req.params.id };
      } else {
        if (!isObjectId) return res.status(404).json({ message: "Resource not found" });
        identifier = { _id: req.params.id };
      }
      const filter = { ...identifier, ...scopedFilter(req) };
      if ((!req.user || req.user.role === "customer") && Model.modelName === "Shop") filter.status = "active";
      if ((!req.user || req.user.role === "customer") && ["Product", "Service"].includes(Model.modelName)) {
        filter.status = "active";
        filter.shop = { $in: await Shop.find({ status: "active" }).distinct("_id") };
      }
      let item = await Model.findOne(filter).populate(populate);
      if (!item) return res.status(404).json({ message: "Resource not found" });
      if (["Product", "Service"].includes(Model.modelName) && (!req.user || req.user.role === "customer")) {
        const viewedItem = await Model.findOneAndUpdate({ _id: item._id, status: "active" }, { $inc: { views: 1 } }, { new: true }).populate(populate);
        if (viewedItem) item = viewedItem;
        if (req.user?.role === "customer" && Model.modelName === "Product") {
          await req.user.updateOne({ $push: { recentlyViewed: { $each: [item._id], $position: 0, $slice: 30 } } });
        }
      }
      res.json({ item });
    }),
    create: asyncHandler(async (req, res) => {
      if (!allowCreate) return res.status(405).json({ message: "Creation is not supported" });
      await populateShops(req, (error) => { if (error) throw error; });
      if (ownerField === "shop" && req.user.role !== "admin" && !req.user.shopIds.some((id) => id.toString() === String(req.body.shop))) {
        return res.status(403).json({ message: "Choose a shop you own" });
      }
      const ownership = ownerField === "shop" ? {} : ownerField ? { [ownerField]: req.user.id || req.user._id } : {};
      let input = { ...req.body, ...ownership };
      if (Model.modelName === "Shop" && req.user.role !== "admin") {
        const categories = input.categories || req.user.shopCategories || [];
        if (!Array.isArray(categories) || !categories.length || categories.length > 10 || categories.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "Select between 1 and 10 valid business categories" });
        const validCategories = await Category.countDocuments({ _id: { $in: categories }, type: { $in: ["shop", "all"] } });
        if (validCategories !== new Set(categories.map(String)).size) return res.status(400).json({ message: "Choose valid business categories" });
        if (!isValidBangladeshLocation(input)) return res.status(400).json({ message: "Choose a valid Bangladesh district and sub-district, then enter your area" });
        if (typeof input.phone !== "string" || !input.phone.trim() || typeof input.address !== "string" || !input.address.trim()) return res.status(400).json({ message: "A primary phone number and full address are required for a business profile" });
        const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        input = {
          ...input,
          owner: req.user.id || req.user._id,
          shopType: ["product", "service"].includes(input.shopType) ? input.shopType : "product",
          categories: [...new Set(categories)],
          category: input.category || categories[0],
          slug: `${slug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
          ownerName: req.user.name,
          email: input.email || req.user.email,
          status: "active",
          verified: false,
          followers: [],
          products: [],
          services: [],
          address: { street: input.address || "", city: input.area, region: input.subDistrict, country: "Bangladesh" },
        };
      }
      if (["Product", "Service"].includes(Model.modelName)) {
        if (input.discountPrice !== undefined && input.discountPrice !== "" && input.discountPrice !== null) {
          if (Number(input.discountPrice) >= Number(input.price)) {
            return res.status(400).json({ message: "Discount price must be lower than the regular price" });
          }
          input.discountPrice = Number(input.discountPrice);
        } else {
          delete input.discountPrice;
        }
      }
      if (["Product", "Service"].includes(Model.modelName) && req.user.role !== "admin") {
        input.owner = req.user.id || req.user._id;
        const allowedFields = Model.modelName === "Product"
          ? ["shop", "owner", "name", "description", "category", "images", "keywords", "condition", "price", "isNegotiable", "discount", "discountPrice", "stock", "deliveryAvailable", "offlinePurchase", "status"]
          : ["shop", "owner", "name", "description", "category", "images", "keywords", "price", "isNegotiable", "discount", "discountPrice", "durationMinutes", "serviceArea", "availability", "status"];
        input = Object.fromEntries(Object.entries(input).filter(([key]) => allowedFields.includes(key)));
      }
      if (Model.modelName === "Shop" && req.user.role !== "admin") {
        const allowedFields = ["owner", "name", "shopType", "categories", "category", "description", "logo", "coverImage", "phone", "phoneSecondary", "email", "district", "subDistrict", "area", "extendedAddress", "address", "location", "openingHours", "ownerName", "slug", "verified", "status", "followers", "products", "services"];
        input = Object.fromEntries(Object.entries(input).filter(([key]) => allowedFields.includes(key)));
      }
      const item = await Model.create(input);
      if (Model.modelName === "Shop" && req.user?.id) {
        await mongoose.model("User").findByIdAndUpdate(req.user.id, { $addToSet: { shops: item._id } });
      }
      if (Model.modelName === "Product" && item.shop) {
        await Shop.findByIdAndUpdate(item.shop, { $addToSet: { products: item._id } });
        if (req.user?.id) await mongoose.model("User").findByIdAndUpdate(req.user.id, { $addToSet: { products: item._id } });
      }
      if (Model.modelName === "Service" && item.shop) {
        await Shop.findByIdAndUpdate(item.shop, { $addToSet: { services: item._id } });
        if (req.user?.id) await mongoose.model("User").findByIdAndUpdate(req.user.id, { $addToSet: { services: item._id } });
      }
      res.status(201).json({ item });
    }),
    update: asyncHandler(async (req, res) => {
      await populateShops(req, (error) => { if (error) throw error; });
      const changes = { ...req.body };
      for (const key of ["_id", "owner", "author", "customer", "sender", "recipient", "shop"]) delete changes[key];
      if (Model.modelName === "Shop" && req.user.role !== "admin") {
        for (const key of ["status", "verified", "rating", "reviewCount", "followers"]) delete changes[key];
        const categories = changes.categories;
        if (categories !== undefined) {
          if (!Array.isArray(categories) || !categories.length || categories.length > 10) return res.status(400).json({ message: "Select between 1 and 10 business categories" });
          const count = await Category.countDocuments({ _id: { $in: categories }, type: { $in: ["shop", "all"] } });
          if (count !== new Set(categories.map(String)).size) return res.status(400).json({ message: "Choose valid business categories" });
          changes.categories = [...new Set(categories)];
          changes.category = changes.categories[0];
        }
        const current = await Model.findOne({ _id: req.params.id, ...scopedFilter(req) });
        if (!current) return res.status(404).json({ message: "Resource not found or not editable" });
        if (["district", "subDistrict", "area"].some((key) => changes[key] !== undefined)
          && !isValidBangladeshLocation({ district: changes.district ?? current.district, subDistrict: changes.subDistrict ?? current.subDistrict, area: changes.area ?? current.area })) {
          return res.status(400).json({ message: "Choose a valid Bangladesh district and sub-district, then enter your area" });
        }
        if (changes.area) changes.address = { ...current.address?.toObject?.(), city: changes.area, region: changes.subDistrict ?? current.subDistrict, country: "Bangladesh" };
        const allowedFields = ["name", "shopType", "categories", "category", "description", "logo", "coverImage", "ownerName", "phone", "phoneSecondary", "email", "district", "subDistrict", "area", "extendedAddress", "address", "location", "openingHours"];
        for (const key of Object.keys(changes)) if (!allowedFields.includes(key)) delete changes[key];
        if (typeof changes.address === "string") {
          changes.address = {
            ...current.address?.toObject?.(),
            street: changes.address,
            city: changes.area ?? current.area,
            region: changes.subDistrict ?? current.subDistrict,
            country: "Bangladesh",
          };
        }
      }
      if (["Product", "Service"].includes(Model.modelName) && req.user.role !== "admin") {
        const allowedFields = Model.modelName === "Product"
          ? ["name", "description", "category", "images", "keywords", "condition", "price", "isNegotiable", "discount", "discountPrice", "stock", "deliveryAvailable", "offlinePurchase"]
          : ["name", "description", "category", "images", "keywords", "price", "isNegotiable", "discount", "discountPrice", "durationMinutes", "serviceArea", "availability", "status"];
        for (const key of Object.keys(changes)) if (!allowedFields.includes(key)) delete changes[key];
      }
      if (["Product", "Service"].includes(Model.modelName) && (changes.discountPrice !== undefined || changes.price !== undefined)) {
        const current = await Model.findOne({ _id: req.params.id, ...scopedFilter(req) }).select("price discountPrice");
        if (!current) return res.status(404).json({ message: "Resource not found or not editable" });
        const discountPrice = changes.discountPrice === undefined ? current.discountPrice : Number(changes.discountPrice);
        const price = changes.price === undefined ? current.price : Number(changes.price);
        if (discountPrice !== undefined && discountPrice !== null && discountPrice !== "" && discountPrice >= price) {
          return res.status(400).json({ message: "Discount price must be lower than the regular price" });
        }
      }
      const item = await Model.findOneAndUpdate({ _id: req.params.id, ...scopedFilter(req) }, { $set: changes }, { new: true, runValidators: true }).populate(populate);
      if (!item) return res.status(404).json({ message: "Resource not found or not editable" });
      res.json({ item });
    }),
    remove: asyncHandler(async (req, res) => {
      await populateShops(req, (error) => { if (error) throw error; });
      const item = await Model.findOneAndDelete({ _id: req.params.id, ...scopedFilter(req) });
      if (!item) return res.status(404).json({ message: "Resource not found or not removable" });
      if (Model.modelName === "Shop") {
        await mongoose.model("User").findByIdAndUpdate(item.owner, { $pull: { shops: item._id } });
        await mongoose.model("Product").deleteMany({ shop: item._id });
        await mongoose.model("Service").deleteMany({ shop: item._id });
      }
      if (Model.modelName === "Product") {
        await Shop.findByIdAndUpdate(item.shop, { $pull: { products: item._id } });
        await mongoose.model("User").findByIdAndUpdate(item.owner || req.user?.id, { $pull: { products: item._id } });
      }
      if (Model.modelName === "Service") {
        await Shop.findByIdAndUpdate(item.shop, { $pull: { services: item._id } });
        await mongoose.model("User").findByIdAndUpdate(item.owner || req.user?.id, { $pull: { services: item._id } });
      }
      res.json({ message: "Resource deleted" });
    }),
    async createNotification({ recipient, type, title, body = "", resource }) {
      return Notification.create({ recipient, type, title, body, resource });
    },
  };
}
