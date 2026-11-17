import mongoose from "mongoose";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { executeBkashPayment, queryBkashPayment } from "../utils/bkash.js";
import { confirmBkashOrder, reviewLateBkashPayment } from "../utils/confirmBkashOrder.js";
import { releaseUnpaidBkashOrder } from "../utils/orderInventory.js";

function clientResult(res, status, orderId) {
  const clientURL = process.env.CLIENT_APP_URL || process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";
  const redirect = new URL("/payment-result", clientURL);
  redirect.searchParams.set("status", status);
  if (orderId) redirect.searchParams.set("order", orderId);
  return res.redirect(303, redirect.toString());
}

export const bkashCallback = asyncHandler(async (req, res) => {
  const orderId = String(req.query.orderId || "");
  const paymentId = String(req.query.paymentID || req.query.paymentId || "");
  const callbackStatus = String(req.query.status || "").toLowerCase();
  if (!mongoose.isValidObjectId(orderId) || !paymentId) return clientResult(res, "failed");

  const order = await Order.findOne({ _id: orderId, paymentMethod: "bkash", bkashPaymentId: paymentId });
  if (!order) return clientResult(res, "failed");
  if (order.paymentStatus === "paid") return clientResult(res, "success", order.id);
  if (order.paymentStatus === "review") return clientResult(res, "review", order.id);
  if (order.paymentStatus === "failed") {
    try {
      const payment = await queryBkashPayment(paymentId);
      const result = await reviewLateBkashPayment(order, payment, req.app.get("io"));
      return clientResult(res, result === "review" ? "review" : "failed", order.id);
    } catch (error) {
      console.error("Unable to verify a late bKash callback:", error);
      return clientResult(res, "pending", order.id);
    }
  }
  if (order.paymentStatus !== "processing") return clientResult(res, "pending", order.id);

  if (callbackStatus !== "success") {
    try {
      const payment = await queryBkashPayment(paymentId);
      if (payment.transactionStatus === "Completed") return clientResult(res, "pending", order.id);
      if (payment.transactionStatus !== "Initiated") return clientResult(res, "pending", order.id);
    } catch (error) {
      console.error("Unable to verify an unsuccessful bKash callback:", error.message);
      return clientResult(res, "pending", order.id);
    }
    await releaseUnpaidBkashOrder(order._id);
    return clientResult(res, "cancelled", order.id);
  }

  let payment;
  try {
    payment = await executeBkashPayment(paymentId);
  } catch (executeError) {
    try {
      payment = await queryBkashPayment(paymentId);
    } catch (queryError) {
      console.error("Unable to reconcile bKash payment:", queryError.message);
      return clientResult(res, "pending", order.id);
    }
    if (payment.transactionStatus !== "Completed") {
      console.error("bKash execution failed and its payment remains unconfirmed:", executeError.message);
      return clientResult(res, "pending", order.id);
    }
  }

  const result = await confirmBkashOrder(order, payment, req.app.get("io"));
  if (result === "review") {
    console.error("bKash reported a completed payment with mismatched order details:", order.id);
    return clientResult(res, "review", order.id);
  }
  if (result === "pending") return clientResult(res, "pending", order.id);
  return clientResult(res, "success", order.id);
});
