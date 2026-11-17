import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, slug: { type: String, required: true, unique: true },
  icon: String, description: String, type: { type: String, enum: ["shop", "product", "service", "all"], default: "all" },
}, { timestamps: true });
export default mongoose.model("Category", categorySchema);
