import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Service from "../models/Service.js";
import Category from "../models/Category.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../uploads/owners");

// A minimal valid 1x1 transparent PNG buffer
const dummyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

function createDummyFile(filename) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, dummyPngBuffer);
}

async function run() {
  await connectDatabase();
  console.log("Connected to MongoDB for seeding dummy shops...");

  // 1. Create or find Owner
  const ownerEmail = "owner@localsphere.com";
  let owner = await User.findOne({ email: ownerEmail });
  if (!owner) {
    owner = await User.create({
      name: "Rafiqul Islam",
      email: ownerEmail,
      password: "password123456",
      role: "owner",
      isVerified: true,
      phone: "01711223344",
      district: "Dhaka",
      subDistrict: "Dhamrai",
      area: "Islampur",
      address: "Road 4, House 12, Islampur",
    });
    console.log("Created demo owner account:", ownerEmail);
  } else {
    owner.role = "owner";
    await owner.save();
    console.log("Found existing demo owner account:", ownerEmail);
  }

  // 2. Fetch or create Categories
  let electronicsCat = await Category.findOne({ name: "Electronics" });
  if (!electronicsCat) {
    electronicsCat = await Category.create({ name: "Electronics", slug: "electronics", type: "all" });
  }
  let repairCat = await Category.findOne({ name: "Repair Services" });
  if (!repairCat) {
    repairCat = await Category.create({ name: "Repair Services", slug: "repair-services", type: "all" });
  }

  // 3. Create dummy image files on disk with 18-digit names
  const imgShop1Cover = "176295306000100001.png";
  const imgShop1Logo = "176295306000100002.png";
  const imgProd1 = "176295306000100003.png";
  const imgProd2 = "176295306000100004.png";

  const imgShop2Cover = "176295306000200001.png";
  const imgShop2Logo = "176295306000200002.png";
  const imgServ1 = "176295306000200003.png";
  const imgServ2 = "176295306000200004.png";

  [imgShop1Cover, imgShop1Logo, imgProd1, imgProd2, imgShop2Cover, imgShop2Logo, imgServ1, imgServ2].forEach(createDummyFile);
  console.log("Created 18-digit dummy image files in uploads/owners/");

  // 4. Create Product Selling Shop
  let shop1 = await Shop.findOne({ name: "ElectroTech Gadget Corner", owner: owner._id });
  if (!shop1) {
    shop1 = await Shop.create({
      owner: owner._id,
      shopType: "product",
      name: "ElectroTech Gadget Corner",
      slug: "electrotech-gadget-corner-" + Date.now().toString().slice(-4),
      category: electronicsCat._id,
      categories: [electronicsCat._id],
      description: "Neighborhood trusted gadgets, gaming accessories, mobile accessories, and electronic items.",
      coverImage: imgShop1Cover,
      logo: imgShop1Logo,
      ownerName: owner.name,
      phone: "01712345678",
      email: "electrotech@example.com",
      district: "Dhaka",
      subDistrict: "Dhamrai",
      area: "Islampur",
      address: { street: "Shop 12, City Market, Islampur", city: "Islampur", region: "Dhamrai", country: "Bangladesh" },
      status: "active",
      verified: true,
      rating: 4.9,
      reviewCount: 18,
    });
    console.log("Created Product Selling Shop:", shop1.name);
  }

  // 5. Create Service Providing Shop
  let shop2 = await Shop.findOne({ name: "QuickFix AC & Electronics Repair", owner: owner._id });
  if (!shop2) {
    shop2 = await Shop.create({
      owner: owner._id,
      shopType: "service",
      name: "QuickFix AC & Electronics Repair",
      slug: "quickfix-ac-repair-" + Date.now().toString().slice(-4),
      category: repairCat._id,
      categories: [repairCat._id],
      description: "Fast in-home repair and maintenance for Air Conditioners, Laptops, Fridges, and Home Electronics.",
      coverImage: imgShop2Cover,
      logo: imgShop2Logo,
      ownerName: owner.name,
      phone: "01812345678",
      email: "quickfix@example.com",
      district: "Dhaka",
      subDistrict: "Dhamrai",
      area: "Islampur",
      address: { street: "Plot 8, Main Road, Islampur", city: "Islampur", region: "Dhamrai", country: "Bangladesh" },
      status: "active",
      verified: true,
      rating: 4.8,
      reviewCount: 24,
    });
    console.log("Created Service Providing Shop:", shop2.name);
  }

  // 6. Add Products to Shop 1
  const existingProd1 = await Product.findOne({ name: "Wireless Noise-Cancelling Earbuds", shop: shop1._id });
  let prod1 = existingProd1;
  if (!existingProd1) {
    prod1 = await Product.create({
      shop: shop1._id,
      owner: owner._id,
      name: "Wireless Noise-Cancelling Earbuds",
      description: "High-definition bass with 36-hour battery backup and instant bluetooth pairing.",
      category: electronicsCat._id,
      price: 1850,
      discountPrice: 1650,
      stock: 25,
      condition: "new",
      images: [imgProd1],
      keywords: ["Mobile Phone", "Smartphone", "Accessories"],
      status: "active",
      rating: 4.9,
    });
    console.log("Created Product 1:", prod1.name);
  }

  const existingProd2 = await Product.findOne({ name: "RGB Mechanical Gaming Keyboard", shop: shop1._id });
  let prod2 = existingProd2;
  if (!existingProd2) {
    prod2 = await Product.create({
      shop: shop1._id,
      owner: owner._id,
      name: "RGB Mechanical Gaming Keyboard",
      description: "Blue switch mechanical switches with customizable RGB backlighting and braided cable.",
      category: electronicsCat._id,
      price: 3200,
      discountPrice: 2850,
      stock: 14,
      condition: "new",
      images: [imgProd2],
      keywords: ["Computer", "Keyboard", "Accessories"],
      status: "active",
      rating: 5.0,
    });
    console.log("Created Product 2:", prod2.name);
  }

  // 7. Add Services to Shop 2
  const existingServ1 = await Service.findOne({ name: "Split AC Master Servicing & Gas Refill", shop: shop2._id });
  let serv1 = existingServ1;
  if (!existingServ1) {
    serv1 = await Service.create({
      shop: shop2._id,
      owner: owner._id,
      name: "Split AC Master Servicing & Gas Refill",
      description: "Deep jet-wash cleaning of indoor and outdoor AC units, cooling check, and original R410a gas top-up.",
      category: repairCat._id,
      price: 1500,
      durationMinutes: 90,
      images: [imgServ1],
      keywords: ["AC Repair", "Electronics Repair", "Auto Service"],
      status: "active",
      rating: 4.9,
    });
    console.log("Created Service 1:", serv1.name);
  }

  const existingServ2 = await Service.findOne({ name: "Laptop & Desktop Hardware Troubleshooting", shop: shop2._id });
  let serv2 = existingServ2;
  if (!existingServ2) {
    serv2 = await Service.create({
      shop: shop2._id,
      owner: owner._id,
      name: "Laptop & Desktop Hardware Troubleshooting",
      description: "Motherboard repair, RAM/SSD upgrade, heating issue resolution, and thermal paste replacement.",
      category: repairCat._id,
      price: 800,
      durationMinutes: 60,
      images: [imgServ2],
      keywords: ["Laptop Repair", "Computer Repair", "Electronics Repair"],
      status: "active",
      rating: 4.8,
    });
    console.log("Created Service 2:", serv2.name);
  }

  // Update shop references
  await Shop.findByIdAndUpdate(shop1._id, {
    $set: { products: [prod1._id, prod2._id].filter(Boolean) }
  });
  await Shop.findByIdAndUpdate(shop2._id, {
    $set: { services: [serv1._id, serv2._id].filter(Boolean) }
  });

  // Update owner references
  await User.findByIdAndUpdate(owner._id, {
    $set: {
      shops: [shop1._id, shop2._id],
      products: [prod1._id, prod2._id].filter(Boolean),
      services: [serv1._id, serv2._id].filter(Boolean),
    }
  });

  console.log("Dummy shops, products, services, and owner records successfully seeded and linked!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

