import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});
export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { readAt: new Date() }, { new: true });
  if (!item) return res.status(404).json({ message: "Notification not found" });
  res.json({ item });
});
