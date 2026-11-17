import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const listMessages = asyncHandler(async (req, res) => {
  const otherId = req.query.with;
  if (!otherId) {
    const rows = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: "$conversationId",
        latest: { $first: "$$ROOT" },
        unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$recipient", req.user._id] }, { $eq: ["$seenAt", null] }] }, 1, 0] } },
      } },
      { $project: {
        _id: 0,
        otherId: { $cond: [{ $eq: ["$latest.sender", req.user._id] }, "$latest.recipient", "$latest.sender"] },
        latest: 1,
        unreadCount: 1,
      } },
      { $sort: { "latest.createdAt": -1 } },
      { $limit: 100 },
    ]);
    const users = await User.find({ _id: { $in: rows.map((row) => row.otherId) }, status: "active" }).select("name avatar role").lean();
    const profiles = new Map(users.map((person) => [String(person._id), person]));
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80).toLowerCase() : "";
    const items = rows.map((row) => ({
      participant: profiles.get(String(row.otherId)),
      latest: row.latest,
      unreadCount: row.unreadCount,
    })).filter((row) => row.participant && (!q || row.participant.name.toLowerCase().includes(q)));
    return res.json({ items });
  }
  if (!mongoose.isValidObjectId(otherId) || String(otherId) === String(req.user.id)) return res.status(400).json({ message: "Provide a valid other conversation participant" });
  const conversationFilter = { $or: [
    { sender: req.user.id, recipient: otherId },
    { sender: otherId, recipient: req.user.id },
  ] };
  await Message.updateMany({ sender: otherId, recipient: req.user.id, seenAt: null }, { $set: { seenAt: new Date() } });
  const items = await Message.find(conversationFilter).sort({ createdAt: -1 }).limit(200);
  items.reverse();
  res.json({ items });
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (!req.body.recipient || (!req.body.text && !req.body.attachment)) return res.status(400).json({ message: "A recipient and message or attachment are required" });
  if (!mongoose.isValidObjectId(req.body.recipient)) return res.status(400).json({ message: "Recipient must be a valid account ID" });
  if (req.body.text !== undefined && (typeof req.body.text !== "string" || req.body.text.length > 5000)) return res.status(400).json({ message: "Message text must be 5,000 characters or fewer" });
  if (req.body.attachment !== undefined && (typeof req.body.attachment !== "string" || !/^https:\/\/res\.cloudinary\.com\//i.test(req.body.attachment))) {
    return res.status(400).json({ message: "Attachments must be uploaded through the LocalSphere image upload endpoint" });
  }
  if (String(req.body.recipient) === String(req.user.id)) return res.status(400).json({ message: "You cannot message yourself" });
  const recipient = await User.exists({ _id: req.body.recipient, status: "active" });
  if (!recipient) return res.status(404).json({ message: "Recipient not found" });
  const participants = [String(req.user.id), String(req.body.recipient)].sort();
  const item = await Message.create({ recipient: req.body.recipient, text: req.body.text || "", attachment: req.body.attachment, sender: req.user.id, conversationId: participants.join(":") });
  const io = req.app.get("io");
  io?.to(item.conversationId).emit("message:new", item);
  const notification = await Notification.create({ recipient: req.body.recipient, type: "message", title: "New message", body: item.text.slice(0, 100), resource: item._id });
  io?.to(`user:${req.body.recipient}`).emit("notification:new", notification);
  res.status(201).json({ item });
});
