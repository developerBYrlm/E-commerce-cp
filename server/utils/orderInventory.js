import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export async function releaseUnpaidBkashOrder(orderId) {
  const session = await mongoose.startSession();
  let releasedOrder = null;
  try {
    await session.withTransaction(async () => {
      releasedOrder = await Order.findOneAndUpdate(
        { _id: orderId, paymentMethod: "bkash", paymentStatus: "processing", status: "placed" },
        { $set: { paymentStatus: "failed", status: "cancelled" } },
        { new: true, session },
      );
      if (!releasedOrder) return;
      for (const line of releasedOrder.items) {
        await Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }
  return releasedOrder;
}
