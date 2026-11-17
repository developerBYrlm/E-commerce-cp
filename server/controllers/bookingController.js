import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listBookings = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : req.user.role === "owner"
    ? { shop: { $in: await Shop.find({ owner: req.user.id }).distinct("_id") } }
    : { customer: req.user.id };
  const items = await Booking.find(filter).populate("customer shop service").limit(100);

  const statusPriority = {
    pending: 0,
    accepted: 1,
    completed: 2,
    cancelled: 3,
    rejected: 4,
  };

  items.sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 99;
    const priorityB = statusPriority[b.status] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    if (a.status === "pending") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (a.status === "accepted") {
      return new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0);
    }
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  res.json({ items });
});

export const createBooking = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.body.service, status: "active" });
  if (!service) return res.status(404).json({ message: "Service not found" });
  const scheduledAt = new Date(req.body.scheduledAt);
  if (Number.isNaN(scheduledAt.valueOf()) || scheduledAt <= new Date()) return res.status(400).json({ message: "Choose a valid future appointment time" });
  const item = await Booking.create({ customer: req.user.id, shop: service.shop, service: service.id, scheduledAt, notes: req.body.notes, price: service.price });
  await Service.updateOne({ _id: service._id }, { $inc: { bookingCount: 1 } });
  const shop = await Shop.findById(service.shop).select("owner");
  const notification = await Notification.create({ recipient: shop.owner, type: "booking", title: "New booking request", body: service.name, resource: item._id });
  req.app.get("io")?.to(`user:${shop.owner}`).emit("notification:new", notification);
  res.status(201).json({ item });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("shop");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  const isOwner = String(booking.shop.owner) === String(req.user.id);
  const isCustomer = String(booking.customer) === String(req.user.id);
  if (req.user.role !== "admin" && !isOwner && !isCustomer) return res.status(403).json({ message: "You cannot update this booking" });

  const updateFields = {};

  if (req.body.status) {
    const allowedTransitions = {
      pending: isOwner ? ["accepted", "rejected"] : ["cancelled"],
      accepted: isOwner ? ["completed"] : ["cancelled"],
    };
    if (!allowedTransitions[booking.status]?.includes(req.body.status)) {
      return res.status(409).json({ message: `Cannot change a ${booking.status} booking to ${req.body.status}` });
    }
    updateFields.status = req.body.status;
  }

  if ((isOwner || req.user.role === "admin") && req.body.price !== undefined) {
    const priceNum = Number(req.body.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "Please provide a valid price" });
    }
    updateFields.price = priceNum;
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: "No valid fields provided to update" });
  }

  const changed = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    { $set: updateFields },
    { new: true, runValidators: true },
  ).populate("customer shop service");

  if (!changed) return res.status(409).json({ message: "Booking changed concurrently; refresh and try again" });
  res.json({ item: changed });
});
