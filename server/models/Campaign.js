import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    target: { type: String, required: true, trim: true },
    targetArea: { type: String, default: "সকল এলাকা" },
    radius: { type: String, default: "1 km" },
    dailyBudget: { type: Number, default: 25 },
    paidDays: { type: Number, default: 7 },
    bonusDays: { type: Number, default: 0 },
    days: { type: Number, default: 7 },
    placements: { type: [String], default: ["ads_clips"] },
    placement: { type: String, default: "ads_clips" },
    placementLabel: { type: String, default: "Ads Clips" },
    videoUrl: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: ["active", "paused", "completed"], default: "active" },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    shopName: { type: String, default: "RUPAYAN" },
    shopLogo: { type: String, default: "" },
    verified: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Campaign", campaignSchema);
