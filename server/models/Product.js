import mongoose from "mongoose";
import { MAX_LISTING_IMAGES, MAX_LISTING_KEYWORDS, MIN_LISTING_KEYWORDS, PRODUCT_KEYWORDS } from "../../shared/catalogOptions.js";
const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 }, description: { type: String, maxlength: 3000, default: "" },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, images: {
    type: [{
      type: String,
      validate: {
        validator: (val) => /^https:\/\/.+/i.test(val) || /^\d{18}\.[a-z0-9]+$/i.test(val) || /^\/uploads\/.+/i.test(val),
        message: "Images must be an HTTPS URL, valid uploaded 18-digit image name, or uploads path",
      },
    }],
    validate: [{ validator: (images) => images.length >= 1 && images.length <= MAX_LISTING_IMAGES, message: `Products need between 1 and ${MAX_LISTING_IMAGES} images` }],
  },
  keywords: {
    type: [{ type: String, enum: PRODUCT_KEYWORDS }],
    validate: [{ validator: (keywords) => new Set(keywords).size === keywords.length && keywords.length >= MIN_LISTING_KEYWORDS && keywords.length <= MAX_LISTING_KEYWORDS, message: `Choose ${MIN_LISTING_KEYWORDS} to ${MAX_LISTING_KEYWORDS} unique product keywords` }],
  },
  condition: { type: String, enum: ["new", "used", "refurbished"], required: true, default: "new" },
  price: { type: Number, required: true, min: 0 },
  isNegotiable: { type: Boolean, default: false },
  discount: { type: Number, min: 0, max: 100, default: 0 },
  discountPrice: { type: Number, min: 0 },
  stock: { type: Number, min: 0, default: 0 }, deliveryAvailable: { type: Boolean, default: true },
  offlinePurchase: { type: Boolean, default: true }, status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
  rating: { type: Number, min: 0, max: 5, default: 0 }, reviewCount: { type: Number, default: 0 },
  soldCount: { type: Number, min: 0, default: 0 },
  views: { type: Number, min: 0, default: 0 },
}, { timestamps: true });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ keywords: 1, status: 1 });
productSchema.pre("validate", function validateDiscountPrice() {
  if (this.discountPrice !== undefined && this.discountPrice !== null && this.discountPrice >= this.price) {
    this.invalidate("discountPrice", "Discount price must be lower than the regular price");
  }
});
export default mongoose.model("Product", productSchema);
