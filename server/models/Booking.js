import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  scheduledAt: { type: Date, required: true }, notes: { type: String, maxlength: 1000, default: "" },
  status: { type: String, enum: ["pending", "accepted", "rejected", "completed", "cancelled"], default: "pending" },
  price: { type: Number, min: 0, required: true },
}, { timestamps: true });
export default mongoose.model("Booking", bookingSchema);
