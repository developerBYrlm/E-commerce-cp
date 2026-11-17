import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { matchesCompletedBkashPayment } from "./bkashPaymentValidation.js";

async function flagForReview(order, eligibleStatuses, io) {
  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentMethod: "bkash",
      paymentStatus: { $in: eligibleStatuses },
      bkashPaymentId: order.bkashPaymentId,
    },
    { $set: { paymentStatus: "review" } },
    { new: true },
  );
  if (!updated) {
    const current = await Order.findById(order._id).select("paymentStatus");
    return current?.paymentStatus === "review" ? "review" : current?.paymentStatus === "paid" ? "success" : "pending";
  }

  try {
    const [shop, admins] = await Promise.all([
      Shop.findById(order.shop).select("owner"),
      User.find({ role: "admin", status: "active" }).select("_id"),
    ]);
    const recipients = new Set([String(order.customer), ...admins.map((admin) => String(admin._id))]);
    if (shop?.owner) recipients.add(String(shop.owner));
    const notifications = await Notification.insertMany([...recipients].map((recipient) => ({
      recipient,
      type: "order",
      title: "bKash payment needs review",
      body: `Payment for order ${order.id} needs manual review. The order is not confirmed.`,
      resource: order._id,
    })));
    for (const notification of notifications) io?.to(`user:${notification.recipient}`).emit("notification:new", notification);
  } catch (error) {
    console.error("Unable to notify support about a bKash payment requiring review:", error);
  }
  return "review";
}

export async function reviewLateBkashPayment(order, payment, io) {
  if (payment?.transactionStatus !== "Completed") return "pending";
  return flagForReview(order, ["failed"], io);
}

export async function confirmBkashOrder(order, payment, io) {
  if (!matchesCompletedBkashPayment(payment, order)) {
    return flagForReview(order, ["processing"], io);
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "processing", bkashPaymentId: order.bkashPaymentId },
    { $set: { paymentStatus: "paid", bkashTransactionId: payment.trxId } },
    { new: true },
  );
  if (!updated) {
    const current = await Order.findById(order._id).select("paymentStatus");
    return current?.paymentStatus === "paid" ? "success" : "pending";
  }

  try {
    const shop = await Shop.findById(order.shop).select("owner");
    if (shop) {
      const notification = await Notification.create({
        recipient: shop.owner,
        type: "order",
        title: "Paid bKash order",
        body: `Order total BDT ${order.subtotal.toFixed(2)}`,
        resource: order._id,
      });
      io?.to(`user:${shop.owner}`).emit("notification:new", notification);
    }
  } catch (error) {
    console.error("Unable to notify the shop about a confirmed bKash payment:", error);
  }
  return "success";
}
