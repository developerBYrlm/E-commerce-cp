import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  rating: { type: Number, required: true, min: 1, max: 5 }, text: { type: String, maxlength: 2000, default: "" },
}, { timestamps: true });
reviewSchema.index({ author: 1, shop: 1, product: 1, service: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
