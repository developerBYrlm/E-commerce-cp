import mongoose from "mongoose";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function textFilter(query, fields) {
  const filter = {};
  const q = String(query.q || "").trim().slice(0, 80);
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = fields.map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  }
  if (query.category) filter.category = query.category;
  if (query.minRating !== undefined) filter.rating = { $gte: Number(query.minRating) };
  return filter;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const search = asyncHandler(async (req, res) => {
  const { query } = req;
  const hasLat = query.lat !== undefined;
  const hasLng = query.lng !== undefined;
  if (hasLat !== hasLng) return res.status(400).json({ message: "Provide both latitude and longitude" });
  const lat = hasLat ? Number(query.lat) : null;
  const lng = hasLng ? Number(query.lng) : null;
  if (hasLat && (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180)) {
    return res.status(400).json({ message: "Coordinates are invalid" });
  }
  if (query.distance !== undefined && !hasLat) return res.status(400).json({ message: "Distance requires latitude and longitude" });
  if (query.category && !mongoose.isValidObjectId(query.category)) return res.status(400).json({ message: "Category ID is invalid" });
  if (query.minRating !== undefined && (!Number.isFinite(Number(query.minRating)) || Number(query.minRating) < 0 || Number(query.minRating) > 5)) {
    return res.status(400).json({ message: "Minimum rating must be between 0 and 5" });
  }
  for (const key of ["minPrice", "maxPrice", "distance"]) {
    if (query[key] !== undefined && (!Number.isFinite(Number(query[key])) || Number(query[key]) < 0)) {
      return res.status(400).json({ message: `${key} must be a non-negative number` });
    }
  }
  const minPrice = query.minPrice === undefined ? undefined : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined ? undefined : Number(query.maxPrice);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return res.status(400).json({ message: "Minimum price cannot exceed maximum price" });
  }
  const types = String(query.type || "shop,product,service").split(",");
  if (types.some((value) => !["shop", "product", "service"].includes(value))) {
    return res.status(400).json({ message: "Search type must be shop, product, or service" });
  }
  const searchTerm = String(query.q || "").trim().slice(0, 80);
  if (req.user && searchTerm) {
    await req.user.updateOne({
      $push: { searchHistory: { $each: [{ query: searchTerm, searchedAt: new Date() }], $position: 0, $slice: 20 } },
    });
  }

  const locality = {};
  for (const key of ["district", "subDistrict", "area"]) {
    if (typeof query[key] === "string" && query[key].trim()) locality[key] = query[key].trim().slice(0, 100);
  }
  const locationTiers = [];
  if (locality.district) locationTiers.push({ district: locality.district });
  if (locality.subDistrict) locationTiers.unshift({ district: locality.district, subDistrict: locality.subDistrict });
  if (locality.area) locationTiers.unshift({ district: locality.district, subDistrict: locality.subDistrict, area: locality.area });
  const shopScope = [{ status: "active" }];
  if (query.verified === "true") shopScope.push({ verified: true });
  if (query.location) {
    const location = escapeRegex(String(query.location).trim().slice(0, 80));
    shopScope.push({
      $or: [
        { "address.city": { $regex: location, $options: "i" } },
        { "address.region": { $regex: location, $options: "i" } },
      ]
    });
  }
  if (locationTiers.length) shopScope.push({ $or: locationTiers });
  if (hasLat) {
    const maxDistance = Math.min(100_000, Math.max(100, Number(query.distance) || 15_000));
    const nearby = await Shop.find({
      status: "active",
      location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: maxDistance } },
    }).select("_id").limit(500);
    shopScope.push({ _id: { $in: nearby.map(({ _id }) => _id) } });
  }
  if (query.openNow === "true") {
    const weekday = new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date()).toLowerCase();
    const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const matching = await Shop.find({ $and: shopScope }).select("_id openingHours").limit(1000);
    const openIds = matching.filter((shop) => {
      const hours = shop.openingHours?.[weekday];
      return hours?.open && hours?.close && hours.open <= time && hours.close > time;
    }).map((shop) => shop._id);
    shopScope.push({ _id: { $in: openIds } });
  }

  const searchText = textFilter(query, ["name", "description"]);
  const shopFilter = { $and: [...shopScope, searchText] };
  const productText = textFilter(query, ["name", "description", "keywords"]);
  const serviceText = textFilter(query, ["name", "description", "keywords"]);
  const productFilter = { status: "active", ...productText };
  const serviceFilter = { status: "active", ...serviceText };
  const price = {};
  if (minPrice !== undefined) price.$gte = minPrice;
  if (maxPrice !== undefined) price.$lte = maxPrice;
  if (Object.keys(price).length) {
    productFilter.price = price;
    serviceFilter.price = price;
  }

  const matchingShopIds = await Shop.find({ $and: shopScope }).distinct("_id");
  productFilter.shop = { $in: matchingShopIds };
  serviceFilter.shop = { $in: matchingShopIds };

  const [shops, products, services] = await Promise.all([
    types.includes("shop") ? Shop.find(shopFilter).populate("category categories", "name").sort({ rating: -1 }).limit(30) : [],
    types.includes("product") ? Product.find(productFilter).populate("shop", "name slug logo verified ownerName category district subDistrict area").populate("category", "name").sort({ createdAt: -1 }).limit(30) : [],
    types.includes("service") ? Service.find(serviceFilter).populate("shop", "name slug logo verified ownerName category district subDistrict area").populate("category", "name").sort({ rating: -1 }).limit(30) : [],
  ]);
  if (locationTiers.length) {
    const rankShop = (shop) => locality.area && shop.area?.toLowerCase() === locality.area.toLowerCase() ? 0
      : locality.subDistrict && shop.subDistrict?.toLowerCase() === locality.subDistrict.toLowerCase() ? 1 : 2;
    shops.sort((left, right) => rankShop(left) - rankShop(right));
    const rankListing = (item) => rankShop(item.shop || {});
    products.sort((left, right) => rankListing(left) - rankListing(right));
    services.sort((left, right) => rankListing(left) - rankListing(right));
  }
  res.json({ results: { shops, products, services }, counts: { shops: shops.length, products: products.length, services: services.length } });
});

export const suggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 80);
  const targetType = String(req.query.type || "").trim().toLowerCase();

  if (!q) {
    const [recentProducts, recentServices, activeCategories] = await Promise.all([
      Product.find({ status: "active" })
        .select("name keywords")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Service.find({ status: "active" })
        .select("name keywords")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Category.find({}).select("name").limit(6).lean(),
    ]);

    const defaultKeywords = new Set();
    // 1. Add real product names from the database as dynamic keyword suggestions
    for (const p of recentProducts) {
      if (p.name) defaultKeywords.add(p.name);
      for (const kw of p.keywords || []) defaultKeywords.add(kw);
    }
    // 2. Add service names
    if (targetType !== "products") {
      for (const s of recentServices) {
        if (s.name) defaultKeywords.add(s.name);
        for (const kw of s.keywords || []) defaultKeywords.add(kw);
      }
    }
    // 3. Fallback popular keywords
    for (const c of activeCategories) {
      if (c.name) defaultKeywords.add(c.name);
    }
    for (const kw of ["table", "bed", "dress", "furniture", "electronics", "fashion", "repair"]) {
      defaultKeywords.add(kw);
    }

    return res.json({
      items: [],
      recommendedKeywords: [...defaultKeywords].slice(0, 10),
      shops: [],
      products: [],
      services: [],
    });
  }

  const expression = new RegExp(escapeRegex(q), "i");
  const activeShopIds = await Shop.find({ status: "active" }).distinct("_id");

  const [shops, products, services, categories] = await Promise.all([
    Shop.find({
      status: "active",
      $or: [{ name: expression }, { description: expression }, { district: expression }, { area: expression }],
    })
      .select("name slug logo coverImage shopType district area rating verified")
      .limit(4)
      .lean(),
    Product.find({
      status: "active",
      shop: { $in: activeShopIds },
      $or: [{ name: expression }, { keywords: expression }, { description: expression }],
    })
      .populate("shop", "name slug logo verified")
      .select("name price discountPrice isNegotiable images keywords shop")
      .limit(6)
      .lean(),
    Service.find({
      status: "active",
      shop: { $in: activeShopIds },
      $or: [{ name: expression }, { keywords: expression }, { description: expression }],
    })
      .populate("shop", "name slug logo verified")
      .select("name price isNegotiable images keywords shop")
      .limit(6)
      .lean(),
    Category.find({ name: expression }).select("name type").limit(5).lean(),
  ]);

  // Extract nearby / related keyword suggestions
  const keywordsSet = new Set();

  // 1. Add product names as keyword suggestions whenever they match the query
  for (const p of products) {
    if (p.name && (p.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(p.name.toLowerCase()))) {
      keywordsSet.add(p.name);
    }
    for (const kw of p.keywords || []) {
      if (kw.toLowerCase().includes(q.toLowerCase())) keywordsSet.add(kw);
    }
  }

  // 2. Add service names as keyword suggestions
  if (targetType !== "products") {
    for (const s of services) {
      if (s.name && (s.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(s.name.toLowerCase()))) {
        keywordsSet.add(s.name);
      }
      for (const kw of s.keywords || []) {
        if (kw.toLowerCase().includes(q.toLowerCase())) keywordsSet.add(kw);
      }
    }
  }

  // 3. Add categories
  for (const c of categories) {
    keywordsSet.add(c.name);
  }

  const ALL_PRESET_KEYWORDS = [
    "clothing", "dress", "mens dress", "shirt", "pant", "fashion",
    "construction", "builder", "building construction", "house construction", "building contractor", "civil contractor", "contractor",
    "architectural design", "interior design", "renovation service", "home renovation", "renovation", "masonry service", "masonry", "mason",
    "tiles fitting", "tiles", "painter service", "painter", "painting", "false ceiling", "gypsum", "steel fabrication", "grill",
    "cement", "rod & steel", "rod", "steel", "bricks", "sand & stone", "sand", "building materials", "sanitary ware", "hardware & tools", "hardware",
    "furniture", "furniture service", "furniture repair", "furniture polish", "furniture assembly", "table", "chair", "bed", "sofa", "sofa repair", "sofa cleaning", "wood polish", "custom furniture", "wardrobe", "almirah",
    "electrician", "electric", "wiring", "repair", "handyman",
    "tv", "smart tv", "led tv", "tv repair", "television repair", "tv installation", "tv wall mounting", "cable tv", "dish tv",
    "fridge", "fridge repair", "fridge servicing", "fridge gas refill", "refrigerator", "refrigerator repair", "refrigerator servicing", "deep freezer", "compressor repair",
    "ac repair", "washing machine repair", "oven repair", "microwave repair", "gas stove repair", "geyser repair",
    "water purifier repair", "ips repair", "ups repair", "generator repair", "cctv repair", "cctv installation",
    "fan repair", "water pump repair", "mobile repair", "phone repair", "laptop repair", "computer repair", "printer repair",
    "car service", "car servicing", "car repair", "car maintenance", "car wash", "car detailing", "car oil change", "car ac repair", "auto service",
    "bike service", "bike servicing", "bike repair", "motorcycle servicing", "motorcycle repair", "bike wash", "bike maintenance", "bicycle repair",
    "plumber", "plumbing", "plumbing service", "pipe leakage", "water tank cleaning", "bathroom fitting", "drain cleaning", "sanitary repair",
    "wifi", "wifi service", "broadband", "broadband service", "internet service", "wifi setup", "wifi router", "router", "optical fiber", "lan setup",
    "locksmith", "door lock repair", "watch repair", "shoe repair", "bag repair",
    "cleaning", "beauty", "haircut", "salon", "groceries", "food", "bakery", "delivery", "carpentry", "maintenance",
    "pizza", "burger", "shawarma", "sharma", "sandwich", "pasta", "fries", "fried chicken", "fast food", "snacks", "biryani", "kacchi", "grill", "kebab", "cake", "coffee", "tea", "juice",
    "pet", "cat", "dog", "bird", "pigeon", "parrot", "cockatiel", "lovebird", "budgie", "quail",
    "medicine", "pharmacy", "first aid", "vitamins", "supplements", "saline", "antiseptic", "gastric medicine", "cough syrup", "cold & flu", "inhaler",
    "book", "books", "library", "bookstore", "book shop", "stationery", "notebook", "novel", "textbook", "story book", "islamic books", "academic book", "reading space"
  ];
  for (const kw of ALL_PRESET_KEYWORDS) {
    if (kw.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(kw.toLowerCase())) {
      keywordsSet.add(kw);
    }
  }

  const unique = new Map();
  for (const [type, values] of [["Shop", shops], ["Product", products], ["Service", services], ["Category", categories]]) {
    for (const value of values) {
      const label = value.name;
      if (!unique.has(label.toLowerCase())) {
        unique.set(label.toLowerCase(), {
          label,
          type,
          id: value._id,
          url: type === "Shop" ? `/shops/${value._id}` : type === "Product" ? `/products/${value._id}` : type === "Service" ? `/services/${value._id}` : `/search?q=${encodeURIComponent(label)}`,
        });
      }
    }
  }

  res.json({
    items: [...unique.values()].slice(0, 10),
    recommendedKeywords: [...keywordsSet].slice(0, 10),
    shops,
    products,
    services,
  });
});
