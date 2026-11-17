import { asyncHandler } from "../utils/asyncHandler.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Shop from "../models/Shop.js";
import { queryBkashRefundStatus, refundBkashPayment } from "../utils/bkash.js";
import { getCompletedBkashRefundTransaction } from "../utils/bkashPaymentValidation.js";

async function notifyRefundParticipants(order, title, body, io) {
  try {
    const shop = await Shop.findById(order.shop).select("owner");
    const recipients = new Set([String(order.customer)]);
    if (shop?.owner) recipients.add(String(shop.owner));
    const notifications = await Notification.insertMany([...recipients].map((recipient) => ({
      recipient,
      type: "order",
      title,
      body,
      resource: order._id,
    })));
    for (const notification of notifications) io?.to(`user:${notification.recipient}`).emit("notification:new", notification);
  } catch (error) {
    console.error("Unable to notify order participants about a bKash refund:", error);
  }
}

async function markRefundCompleted(order, refundTransactionId, io) {
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentMethod: "bkash", paymentStatus: "paid", refundStatus: { $in: ["processing", "review"] } },
    { $set: { paymentStatus: "refunded", refundStatus: "completed", bkashRefundTransactionId: refundTransactionId } },
    { new: true },
  );
  if (!updated) {
    const current = await Order.findById(order._id);
    if (current?.refundStatus === "completed") return current;
    throw Object.assign(new Error("The order changed while the refund was being confirmed"), { status: 409 });
  }
  await notifyRefundParticipants(
    updated,
    "Order refunded",
    `Your bKash refund of BDT ${updated.refundAmount.toFixed(2)} was confirmed.`,
    io,
  );
  return updated;
}

async function markRefundForReview(order) {
  return Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "paid", refundStatus: "processing" },
    { $set: { refundStatus: "review" } },
    { new: true },
  );
}

export const initiateBkashRefund = asyncHandler(async (req, res) => {
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  if (!reason || reason.length > 255) return res.status(400).json({ message: "Provide a refund reason between 1 and 255 characters" });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentMethod !== "bkash" || order.paymentStatus !== "paid" || order.refundStatus !== "none"
    || !order.bkashPaymentId || !order.bkashTransactionId) {
    return res.status(409).json({ message: "Only paid bKash orders without an existing refund can be refunded" });
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentMethod: "bkash", paymentStatus: "paid", refundStatus: { $in: ["none", null] } },
    { $set: { refundStatus: "processing", refundAmount: order.subtotal, refundReason: reason, refundRequestedAt: new Date() } },
    { new: true },
  );
  if (!claimed) return res.status(409).json({ message: "A refund is already in progress or has already been processed" });

  let response;
  try {
    response = await refundBkashPayment({
      paymentId: claimed.bkashPaymentId,
      refundAmount: claimed.subtotal,
      sku: `LS-${claimed.id}`.slice(0, 255),
      reason,
      trxId: claimed.bkashTransactionId,
    });
  } catch (error) {
    await markRefundForReview(claimed);
    console.error("bKash refund response is uncertain; verify its status before any retry:", error);
    return res.status(202).json({
      item: await Order.findById(claimed._id),
      message: "The refund response is uncertain. Check the bKash refund status before taking further action.",
    });
  }

  const refundTransactionId = getCompletedBkashRefundTransaction(response, claimed);
  if (!refundTransactionId) {
    await markRefundForReview(claimed);
    return res.status(202).json({
      item: await Order.findById(claimed._id),
      message: "bKash did not confirm the full refund. Check its status before taking further action.",
    });
  }

  const item = await markRefundCompleted(claimed, refundTransactionId, req.app.get("io"));
  res.json({ item, message: "Full bKash refund confirmed" });
});

export const reconcileBkashRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentMethod !== "bkash" || !["processing", "review"].includes(order.refundStatus)
    || !order.bkashPaymentId || !order.bkashTransactionId) {
    return res.status(409).json({ message: "This order has no pending bKash refund to reconcile" });
  }

  const refund = await queryBkashRefundStatus({
    paymentId: order.bkashPaymentId,
    trxId: order.bkashTransactionId,
  });
  const refundTransactionId = getCompletedBkashRefundTransaction(refund, order);
  if (!refundTransactionId) {
    if (order.refundStatus === "processing") await markRefundForReview(order);
    return res.status(202).json({
      item: await Order.findById(order._id),
      message: "bKash has not confirmed the full refund. The order remains under review.",
    });
  }

  const item = await markRefundCompleted(order, refundTransactionId, req.app.get("io"));
  res.json({ item, message: "Full bKash refund confirmed" });
});
