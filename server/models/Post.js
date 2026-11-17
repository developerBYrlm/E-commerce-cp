import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({ author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, text: { type: String, required: true, maxlength: 1000 } }, { timestamps: true });
const postSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["offer", "product", "service", "news"], default: "news" },
  body: { type: String, required: true, maxlength: 3000 }, images: [String],
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema], shares: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model("Post", postSchema);
