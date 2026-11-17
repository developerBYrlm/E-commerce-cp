import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["order", "booking", "message", "review", "system"], required: true },
  title: { type: String, required: true }, body: { type: String, maxlength: 500, default: "" },
  resource: { type: mongoose.Schema.Types.ObjectId }, readAt: Date,
}, { timestamps: true });
export default mongoose.model("Notification", notificationSchema);
