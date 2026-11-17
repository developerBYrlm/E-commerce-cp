import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetType: { type: String, enum: ["Shop", "Product", "Service"], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetType" },
  reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
  status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending", index: true },
}, { timestamps: true });
reportSchema.index({ reporter: 1, targetType: 1, target: 1 }, { unique: true });

export default mongoose.model("Report", reportSchema);
