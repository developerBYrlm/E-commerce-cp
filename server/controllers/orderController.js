import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { canTransitionOrder } from "../utils/orderTransitions.js";
import { createBkashPayment, isBkashConfigured } from "../utils/bkash.js";
import { releaseUnpaidBkashOrder } from "../utils/orderInventory.js";

async function canAccessOrder(order, user) {
  if (user.role === "admin" || String(order.customer) === String(user.id)) return true;
  const shop = order.shop?.owner ? order.shop : await Shop.findById(order.shop).select("owner");
  return user.role === "owner" && String(shop?.owner) === String(user.id);
}

export const listOrders = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : req.user.role === "owner"
    ? { shop: { $in: await Shop.find({ owner: req.user.id }).distinct("_id") } }
    : { customer: req.user.id };
  const items = await Order.find(filter).populate("shop customer items.product").sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});

export const getOrder = asyncHandler(async (req, res) => {
  const item = await Order.findById(req.params.id).populate("shop customer items.product");
  if (!item) return res.status(404).json({ message: "Order not found" });
  if (!(await canAccessOrder(item, req.user))) return res.status(403).json({ message: "You cannot access this order" });
  res.json({ item });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const item = await Order.findById(req.params.id).populate("shop");
  if (!item) return res.status(404).json({ message: "Order not found" });
  if (!(await canAccessOrder(item, req.user))) return res.status(403).json({ message: "You cannot update this order" });
  const nextStatus = req.body.status;
  if (!canTransitionOrder(item.status, nextStatus, req.user.role)) {
    const status = req.user.role === "customer" ? 403 : 409;
    return res.status(status).json({ message: `Cannot change an order from ${item.status} to ${nextStatus}` });
  }
  if (nextStatus === "cancelled" && item.paymentStatus === "paid") return res.status(409).json({ message: "Paid orders must be refunded before cancellation" });
  if (item.paymentMethod === "bkash" && item.paymentStatus !== "paid") return res.status(409).json({ message: "Wait for bKash payment confirmation before updating this order" });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const changed = await Order.findOneAndUpdate(
        { _id: item._id, status: item.status },
        { $set: { status: nextStatus } },
        { new: true, runValidators: true, session },
      );
      if (!changed) throw Object.assign(new Error("Order changed concurrently; refresh and try again"), { status: 409 });
      if (nextStatus === "cancelled") {
        for (const line of item.items) {
          await Product.updateOne({ _id: line.product }, { $inc: { stock: line.quantity } }, { session });
        }
      }
      item.status = changed.status;
    });
  } finally {
    await session.endSession();
  }
  res.json({ item });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { items, fulfillment = "delivery", paymentMethod = "cod", deliveryAddress, deliveryZone } = req.body;
  if (!["delivery", "pickup"].includes(fulfillment)) return res.status(400).json({ message: "Choose delivery or pickup" });
  if (!["cod", "bkash"].includes(paymentMethod)) return res.status(400).json({ message: "Choose a supported payment method" });
  if (paymentMethod === "bkash" && !isBkashConfigured()) return res.status(503).json({ message: "bKash sandbox credentials and PUBLIC_API_URL must be configured" });
  if (fulfillment === "delivery") {
    if (!deliveryAddress || typeof deliveryAddress !== "object") {
      return res.status(400).json({ message: "A valid street address and city are required for delivery" });
    }
    const street = deliveryAddress.street || deliveryAddress.address || "";
    const city = deliveryAddress.city || deliveryAddress.district || "";
    if (typeof street !== "string" || !street.trim() || typeof city !== "string" || !city.trim()
      || street.length > 200 || city.length > 100) {
      return res.status(400).json({ message: "A valid street address and city are required for delivery" });
    }
    deliveryAddress.street = street.trim();
    deliveryAddress.city = city.trim();
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return res.status(400).json({ message: "An order must contain between 1 and 50 items" });
  const normalized = new Map();
  for (const line of items) {
    if (!mongoose.isValidObjectId(line.product) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100) return res.status(400).json({ message: "Each item needs a valid product and quantity" });
    normalized.set(String(line.product), (normalized.get(String(line.product)) || 0) + line.quantity);
  }
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const ids = [...normalized.keys()];
      const products = await Product.find({ _id: { $in: ids }, status: "active" }).session(session);
      if (products.length !== ids.length) throw Object.assign(new Error("One or more products are no longer available"), { status: 400 });
      const shopIds = new Set(products.map((product) => String(product.shop)));
      if (shopIds.size !== 1) throw Object.assign(new Error("Checkout items must be from a single shop"), { status: 400 });
      const shop = await Shop.findOne({ _id: products[0].shop, status: "active" }).session(session);
      if (!shop) throw Object.assign(new Error("Shop is not available"), { status: 400 });
      let subtotal = 0;
      const orderItems = [];
      for (const product of products) {
        const quantity = normalized.get(String(product._id));
        if (fulfillment === "delivery" && !product.deliveryAvailable) throw Object.assign(new Error(`${product.name} is available for pickup only`), { status: 400 });
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, stock: { $gte: quantity }, status: "active" },
          { $inc: { stock: -quantity, soldCount: quantity } }, { new: true, session },
        );
        if (!updated) throw Object.assign(new Error(`${product.name} does not have enough stock`), { status: 409 });
        const unitPrice = Math.round(product.price * (1 - product.discount / 100) * 100) / 100;
        subtotal = Math.round((subtotal + unitPrice * quantity) * 100) / 100;
        orderItems.push({ product: product._id, name: product.name, quantity, unitPrice });
      }
      const deliveryCharge = fulfillment === "delivery" ? (
        req.body.deliveryCharge !== undefined ? Number(req.body.deliveryCharge) :
          deliveryZone === "outside_dhaka" ? 150 :
            deliveryZone === "dhaka_suburbs" ? 100 : 70
      ) : 0;
      const total = Math.round((subtotal + deliveryCharge) * 100) / 100;
      [order] = await Order.create([{
        customer: req.user.id, shop: products[0].shop, items: orderItems, subtotal,
        deliveryCharge, deliveryZone: deliveryZone || "inside_dhaka", total,
        fulfillment, paymentMethod, deliveryAddress,
        ...(paymentMethod === "bkash" ? { paymentStatus: "processing" } : {}),
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  const shop = await Shop.findById(order.shop).select("owner");
  if (paymentMethod === "bkash") {
    const callback = new URL("/api/payments/bkash/callback", process.env.PUBLIC_API_URL);
    callback.searchParams.set("orderId", order.id);
    try {
      const payment = await createBkashPayment({
        amount: order.subtotal,
        invoice: `LS-${order.id}`,
        callbackURL: callback.toString(),
      });
      order.bkashPaymentId = payment.paymentId;
      await order.save();
      return res.status(201).json({ item: order, redirectUrl: payment.checkoutURL, message: "Continue to bKash to complete payment" });
    } catch (error) {
      await releaseUnpaidBkashOrder(order._id);
      throw error;
    }
  }
  if (shop) {
    const notification = await Notification.create({ recipient: shop.owner, type: "order", title: "New order", body: `Order total BDT ${order.subtotal.toFixed(2)}`, resource: order._id });
    req.app.get("io")?.to(`user:${shop.owner}`).emit("notification:new", notification);
  }
  res.status(201).json({ item: order, message: "Order placed" });
});
