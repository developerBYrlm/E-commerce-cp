import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, name: String, quantity: { type: Number, min: 1, required: true }, unitPrice: { type: Number, min: 0, required: true } }],
  subtotal: { type: Number, min: 0, required: true },
  deliveryCharge: { type: Number, default: 0 },
  deliveryZone: { type: String, enum: ["inside_dhaka", "dhaka_suburbs", "outside_dhaka"], default: "inside_dhaka" },
  total: { type: Number, min: 0 },
  deliveryAddress: mongoose.Schema.Types.Mixed,
  fulfillment: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  paymentMethod: { type: String, enum: ["cod", "bkash"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "processing", "paid", "failed", "review", "refunded"], default: "pending" },
  bkashPaymentId: { type: String, unique: true, sparse: true },
  bkashTransactionId: { type: String, unique: true, sparse: true },
  refundStatus: { type: String, enum: ["none", "processing", "review", "completed"], default: "none" },
  refundAmount: { type: Number, min: 0 },
  refundReason: { type: String, maxlength: 255 },
  bkashRefundTransactionId: { type: String, unique: true, sparse: true },
  refundRequestedAt: Date,
  status: { type: String, enum: ["placed", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"], default: "placed" },
}, { timestamps: true });
orderSchema.index({ paymentMethod: 1, paymentStatus: 1, status: 1, createdAt: 1 });
export default mongoose.model("Order", orderSchema);
