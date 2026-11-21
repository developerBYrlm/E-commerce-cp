import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  avatar: String,
  phone: { type: String, maxlength: 30, trim: true, default: "" },
  district: { type: String, maxlength: 100, default: "" },
  subDistrict: { type: String, maxlength: 100, default: "" },
  area: { type: String, maxlength: 100, default: "" },
  address: { type: String, maxlength: 300, default: "" },
  extendedAddress: { type: String, maxlength: 300, default: "" },
  role: { type: String, enum: ["admin", "owner", "customer"], default: "customer" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  isVerified: { type: Boolean, default: false },
  subscriptionPlan: { type: String, enum: ["starter", "growth", "elite"], default: "starter" },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shop" }],
  followingServices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  shopCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  shops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shop" }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
  searchHistory: [{ query: { type: String, maxlength: 80 }, searchedAt: { type: Date, default: Date.now } }],
  recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });
userSchema.index({ location: "2dsphere" });
userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password") && this.password) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};
export default mongoose.model("User", userSchema);
