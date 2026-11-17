import mongoose from "mongoose";
const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  shopType: { type: String, enum: ["product", "service"], default: "product" },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  description: { type: String, maxlength: 2000, default: "" },
  logo: String, coverImage: String, ownerName: String,
  phone: String, phoneSecondary: String, email: String,
  district: { type: String, maxlength: 100, default: "" },
  subDistrict: { type: String, maxlength: 100, default: "" },
  area: { type: String, maxlength: 100, default: "" },
  extendedAddress: { type: String, maxlength: 300, default: "" },
  address: { street: String, city: String, region: String, postalCode: String, country: { type: String, default: "Bangladesh" } },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
  openingHours: { type: mongoose.Schema.Types.Mixed, default: {} },
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "active", "suspended"], default: "active" },
  rating: { type: Number, min: 0, max: 5, default: 0 }, reviewCount: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
shopSchema.index({ location: "2dsphere" });
shopSchema.index({ name: "text", description: "text" });
shopSchema.index({ district: 1, subDistrict: 1, area: 1, status: 1 });
shopSchema.index({ shopType: 1, status: 1 });
export default mongoose.model("Shop", shopSchema);
