import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Product from "../server/models/Product.js";
import Service from "../server/models/Service.js";
import { PRODUCT_KEYWORDS, SERVICE_KEYWORDS } from "../shared/catalogOptions.js";
import { isValidBangladeshLocation } from "../server/utils/bangladeshLocation.js";

test("Bangladesh location validation requires a matching district and upazila", () => {
  assert.equal(isValidBangladeshLocation({ district: "Dhaka", subDistrict: "Dhamrai", area: "Islampur" }), true);
  assert.equal(isValidBangladeshLocation({ district: "Dhaka", subDistrict: "Dhanmondi", area: "Road 27" }), true);
  assert.equal(isValidBangladeshLocation({ district: "Dhaka", subDistrict: "Gulshan", area: "Gulshan 2" }), true);
  assert.equal(isValidBangladeshLocation({ district: "Chattogram", subDistrict: "Panchlaish", area: "GEC Circle" }), true);
  assert.equal(isValidBangladeshLocation({ district: "Dhaka", subDistrict: "Dhamrai", area: " " }), false);
  assert.equal(isValidBangladeshLocation({ district: "Dhaka", subDistrict: "Raozan", area: "Islampur" }), false);
  assert.equal(isValidBangladeshLocation({ district: "Not a district", subDistrict: "Dhamrai", area: "Islampur" }), false);
});

test("products require 1–5 HTTPS images and 3–10 predefined unique keywords", async () => {
  const base = {
    shop: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    name: "Sample product",
    price: 100,
    images: ["https://images.example.com/item.jpg"],
    keywords: PRODUCT_KEYWORDS.slice(0, 3),
  };
  await new Product(base).validate();
  await assert.rejects(new Product({ ...base, images: ["http://images.example.com/item.jpg"] }).validate());
  await assert.rejects(new Product({ ...base, keywords: PRODUCT_KEYWORDS.slice(0, 2) }).validate());
  await assert.rejects(new Product({ ...base, keywords: [PRODUCT_KEYWORDS[0], PRODUCT_KEYWORDS[0], PRODUCT_KEYWORDS[1]] }).validate());
  await assert.rejects(new Product({ ...base, images: Array.from({ length: 6 }, (_, index) => `https://images.example.com/${index}.jpg`) }).validate());
  await assert.rejects(new Product({ ...base, price: 100, discountPrice: 100 }).validate());
});

test("services enforce predefined keywords and a five-image maximum", async () => {
  const base = {
    shop: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    name: "Sample service",
    price: 100,
    images: ["https://images.example.com/service.jpg"],
    keywords: SERVICE_KEYWORDS.slice(0, 3),
  };
  await new Service(base).validate();
  await assert.rejects(new Service({ ...base, keywords: ["Made up", ...SERVICE_KEYWORDS.slice(1, 3)] }).validate());
  await assert.rejects(new Service({ ...base, images: Array.from({ length: 6 }, (_, index) => `https://images.example.com/${index}.jpg`) }).validate());
});
