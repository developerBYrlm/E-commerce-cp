import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import MessageBucket from "../models/MessageBucket.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  compressMessageContent,
  decompressMessageContent,
  compressMessageArray,
  decompressMessageArray,
} from "../utils/chatCompression.js";
import { isUserOnline, getUserLastSeen } from "../sockets/chatSocket.js";

/**
 * Format internal message subdoc to client response
 */
function formatMessage(msg) {
  const content = decompressMessageContent(msg.c);
  return {
    _id: msg._id,
    sender: msg.s,
    content,
    type: msg.t || "text",
    status: msg.st || "sent",
    createdAt: msg.ts,
    metadata: msg.m || null,
  };
}

/**
 * GET /api/chat/inbox
 * Loads denormalized inbox snapshot with lean() and select() for zero-overhead performance
 */
export const getInbox = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sUserId = String(userId);
  const filter = req.query.filter || "all"; // "all" | "unread" | "pinned" | "archived"
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

  // Base query: conversations where user is a participant
  const baseFilter = { participants: userId };

  if (filter === "pinned") {
    baseFilter.pinnedBy = userId;
    baseFilter.archivedBy = { $ne: userId };
  } else if (filter === "archived") {
    baseFilter.archivedBy = userId;
  } else {
    // "all" or "unread": exclude archived by default
    baseFilter.archivedBy = { $ne: userId };
  }

  // Ultra-fast lean query with indexed participants and updatedAt
  const convDocs = await Conversation.find(baseFilter)
    .sort({ updatedAt: -1 })
    .lean()
    .select("participants unreadCounts pinnedBy mutedBy archivedBy lastMessage activeBucketSeq updatedAt createdAt");

  // Collect all other participant IDs
  const otherUserIds = new Set();
  for (const conv of convDocs) {
    const otherId = conv.participants.find((p) => String(p) !== sUserId);
    if (otherId) otherUserIds.add(String(otherId));
  }

  // Batch fetch other user profiles with lean()
  const users = await User.find({
    _id: { $in: Array.from(otherUserIds) },
    status: "active",
  })
    .select("name avatar role email district area")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  // Batch fetch any shops owned by participants (to display shop badge)
  const ownerIds = users.filter((u) => u.role === "owner").map((u) => u._id);
  const shops = await Shop.find({ owner: { $in: ownerIds }, status: "active" })
    .select("name logo owner shopType slug")
    .lean();
  const shopMap = new Map(shops.map((s) => [String(s.owner), s]));

  // Build inbox list items
  const items = [];
  let totalUnread = 0;
  let totalPinned = 0;
  let totalArchived = 0;

  for (const conv of convDocs) {
    const otherId = String(conv.participants.find((p) => String(p) !== sUserId) || "");
    const otherUser = userMap.get(otherId);
    if (!otherUser) continue; // Skip if user account is deleted or inactive

    const shop = shopMap.get(otherId) || null;
    const isPinned = Array.isArray(conv.pinnedBy) && conv.pinnedBy.some((p) => String(p) === sUserId);
    const isMuted = Array.isArray(conv.mutedBy) && conv.mutedBy.some((p) => String(p) === sUserId);
    const isArchived = Array.isArray(conv.archivedBy) && conv.archivedBy.some((p) => String(p) === sUserId);

    // Unread count from Map or plain object
    let unreadCount = 0;
    if (conv.unreadCounts) {
      if (typeof conv.unreadCounts.get === "function") {
        unreadCount = conv.unreadCounts.get(sUserId) || 0;
      } else {
        unreadCount = conv.unreadCounts[sUserId] || 0;
      }
    }

    if (unreadCount > 0) totalUnread += 1;
    if (isPinned) totalPinned += 1;
    if (isArchived) totalArchived += 1;

    // Filter by search query if provided
    if (q) {
      const matchName = otherUser.name.toLowerCase().includes(q);
      const matchShop = shop?.name.toLowerCase().includes(q);
      const matchMsg = conv.lastMessage?.previewText?.toLowerCase().includes(q);
      if (!matchName && !matchShop && !matchMsg) continue;
    }

    // Filter by unread pill
    if (filter === "unread" && unreadCount === 0) continue;

    items.push({
      _id: conv._id,
      participant: {
        _id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar,
        role: otherUser.role,
        shop: shop ? { name: shop.name, logo: shop.logo, shopType: shop.shopType, slug: shop.slug } : null,
        isOnline: isUserOnline(otherId),
        lastSeen: getUserLastSeen(otherId),
      },
      lastMessage: conv.lastMessage
        ? {
            senderId: conv.lastMessage.senderId,
            previewText: conv.lastMessage.previewText,
            type: conv.lastMessage.type,
            status: conv.lastMessage.status,
            createdAt: conv.lastMessage.createdAt,
          }
        : null,
      unreadCount,
      isPinned,
      isMuted,
      isArchived,
      updatedAt: conv.updatedAt,
    });
  }

  // Sort: pinned first, then newest updatedAt
  items.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  res.json({
    items,
    counts: {
      all: convDocs.filter((c) => !c.archivedBy?.some((p) => String(p) === sUserId)).length,
      unread: totalUnread,
      pinned: totalPinned,
      archived: totalArchived,
    },
  });
});

/**
 * POST /api/chat/conversations
 * Initiates or retrieves an existing conversation.
 * Strictly enforces business rule: Only customers can initiate chats with shop owners!
 */
export const getOrInitiateConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;
  const currentUserId = req.user._id;

  if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
    return res.status(400).json({ message: "Valid recipient ID is required" });
  }

  if (String(recipientId) === String(currentUserId)) {
    return res.status(400).json({ message: "You cannot start a conversation with yourself" });
  }

  const recipient = await User.findById(recipientId).select("name avatar role status").lean();
  if (!recipient || recipient.status !== "active") {
    return res.status(404).json({ message: "Recipient user not found or unavailable" });
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, recipient._id], $size: 2 },
  });

  if (!conversation) {
    // ENFORCE BUSINESS POLICY:
    // Only customers can initiate conversations with shop owners!
    // Shop owners cannot initiate conversations with customers or other shop owners.
    if (req.user.role === "owner") {
      return res.status(403).json({
        message: "Shop owners can only reply to customer inquiries, and cannot initiate new chats with other owners or customers.",
      });
    }

    // Customers can only initiate with shop owners (or admins)
    if (recipient.role !== "owner" && recipient.role !== "admin") {
      return res.status(403).json({
        message: "Customers can only initiate conversations with shop owners.",
      });
    }

    conversation = await Conversation.create({
      participants: [currentUserId, recipient._id],
      unreadCounts: {
        [String(currentUserId)]: 0,
        [String(recipient._id)]: 0,
      },
      activeBucketSeq: 0,
    });

    // Create initial message bucket 0
    await MessageBucket.create({
      conversationId: conversation._id,
      bucketSeq: 0,
      count: 0,
      messages: [],
    });
  }

  // Get recipient shop if owner
  const shop = recipient.role === "owner"
    ? await Shop.findOne({ owner: recipient._id, status: "active" }).select("name logo shopType slug").lean()
    : null;

  res.json({
    conversation: {
      _id: conversation._id,
      participant: {
        _id: recipient._id,
        name: recipient.name,
        avatar: recipient.avatar,
        role: recipient.role,
        shop,
        isOnline: isUserOnline(String(recipient._id)),
        lastSeen: getUserLastSeen(String(recipient._id)),
      },
      unreadCount: conversation.unreadCounts?.get?.(String(currentUserId)) || conversation.unreadCounts?.[String(currentUserId)] || 0,
      pinned: conversation.pinnedBy?.some((p) => String(p) === String(currentUserId)) || false,
      muted: conversation.mutedBy?.some((p) => String(p) === String(currentUserId)) || false,
      archived: conversation.archivedBy?.some((p) => String(p) === String(currentUserId)) || false,
      lastMessage: conversation.lastMessage,
      updatedAt: conversation.updatedAt,
    },
  });
});

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Fetches messages using the Bucket pattern, decompressing transparently.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;
  const sUserId = String(currentUserId);
  const cursorBucketSeq = req.query.cursor !== undefined ? Number(req.query.cursor) : null;

  if (!mongoose.isValidObjectId(conversationId)) {
    return res.status(400).json({ message: "Invalid conversation ID" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.some((p) => String(p) === sUserId)) {
    return res.status(404).json({ message: "Conversation not found or access denied" });
  }

  // Determine target bucketSeq: start from activeBucketSeq if no cursor provided
  const targetSeq = cursorBucketSeq !== null ? cursorBucketSeq : conversation.activeBucketSeq;

  // Fetch bucket
  const bucket = await MessageBucket.findOne({
    conversationId: conversation._id,
    bucketSeq: targetSeq,
  }).lean();

  let rawMessages = [];
  if (bucket) {
    if (bucket.isCompressed && bucket.compressedPayload) {
      rawMessages = decompressMessageArray(bucket.compressedPayload);
    } else if (Array.isArray(bucket.messages)) {
      rawMessages = bucket.messages;
    }
  }

  // Format and transparently decompress content
  const formattedMessages = rawMessages.map(formatMessage);

  // If this was the active bucket and user had unread messages, mark them as read
  let unreadCount = 0;
  if (conversation.unreadCounts) {
    unreadCount = typeof conversation.unreadCounts.get === "function"
      ? conversation.unreadCounts.get(sUserId) || 0
      : conversation.unreadCounts[sUserId] || 0;
  }

  if (unreadCount > 0) {
    if (typeof conversation.unreadCounts.set === "function") {
      conversation.unreadCounts.set(sUserId, 0);
    } else {
      conversation.unreadCounts[sUserId] = 0;
    }
    if (conversation.lastMessage && String(conversation.lastMessage.senderId) !== sUserId) {
      conversation.lastMessage.status = "read";
    }
    await conversation.save();

    // Also update message status in active uncompressed bucket if needed
    if (bucket && !bucket.isCompressed) {
      await MessageBucket.updateOne(
        { _id: bucket._id },
        { $set: { "messages.$[elem].st": "read" } },
        { arrayFilters: [{ "elem.s": { $ne: currentUserId }, "elem.st": { $ne: "read" } }] }
      );
    }

    // Notify other participant that messages were read
    const otherId = conversation.participants.find((p) => String(p) !== sUserId);
    const io = req.app.get("io");
    if (io && otherId) {
      io.to(`user:${otherId}`).emit("chat:messages_read", {
        conversationId: String(conversation._id),
        readerId: sUserId,
      });
    }
  }

  const nextCursor = targetSeq > 0 ? targetSeq - 1 : null;

  res.json({
    messages: formattedMessages,
    conversationId: conversation._id,
    nextCursor,
    activeBucketSeq: conversation.activeBucketSeq,
  });
});

/**
 * POST /api/chat/messages
 * Sends a message, compressing long text (>400 chars) and closing/compressing full buckets (50 msgs).
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const sUserId = String(currentUserId);
  const { conversationId, recipientId, content, type = "text", metadata } = req.body;

  let conversation;
  if (conversationId && mongoose.isValidObjectId(conversationId)) {
    conversation = await Conversation.findById(conversationId);
  }

  let targetRecipientId = recipientId;

  if (conversation) {
    if (!conversation.participants.some((p) => String(p) === sUserId)) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }
    targetRecipientId = String(conversation.participants.find((p) => String(p) !== sUserId));
  } else if (recipientId && mongoose.isValidObjectId(recipientId)) {
    // Check if conversation exists
    conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    });

    if (!conversation) {
      // Role enforcement check
      if (req.user.role === "owner") {
        return res.status(403).json({
          message: "Shop owners can only reply to customer inquiries, and cannot initiate new chats with other owners or customers.",
        });
      }
      const recipient = await User.findById(recipientId).select("role status").lean();
      if (!recipient || recipient.status !== "active") {
        return res.status(404).json({ message: "Recipient not found or inactive" });
      }
      if (recipient.role !== "owner" && recipient.role !== "admin") {
        return res.status(403).json({
          message: "Customers can only initiate conversations with shop owners.",
        });
      }
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        unreadCounts: {
          [sUserId]: 0,
          [String(recipientId)]: 0,
        },
        activeBucketSeq: 0,
      });
      await MessageBucket.create({
        conversationId: conversation._id,
        bucketSeq: 0,
        count: 0,
        messages: [],
      });
    }
  } else {
    return res.status(400).json({ message: "Either conversationId or recipientId is required" });
  }

  // Validate message content
  const rawText = typeof content === "string" ? content.trim() : "";
  if (!rawText && type === "text") {
    return res.status(400).json({ message: "Message content cannot be empty" });
  }
  if (rawText.length > 5000) {
    return res.status(400).json({ message: "Message text cannot exceed 5000 characters" });
  }

  // Compress if single text message is > 400 characters
  let processedContent = rawText;
  if (type === "text" && rawText.length > 400) {
    const compResult = compressMessageContent(rawText);
    processedContent = compResult.data;
  }

  // Fetch or create active MessageBucket
  let bucket = await MessageBucket.findOne({
    conversationId: conversation._id,
    bucketSeq: conversation.activeBucketSeq,
  });

  if (!bucket) {
    bucket = await MessageBucket.create({
      conversationId: conversation._id,
      bucketSeq: conversation.activeBucketSeq,
      count: 0,
      messages: [],
    });
  }

  // BUCKET PATTERN: If bucket is full (count >= 50), compress it and spawn a new bucket
  if (bucket.count >= 50) {
    // Compress entire messages array into BinData
    const compressedPayload = compressMessageArray(bucket.messages);
    bucket.compressedPayload = compressedPayload;
    bucket.messages = [];
    bucket.isCompressed = true;
    await bucket.save();

    // Advance sequence in conversation
    conversation.activeBucketSeq += 1;
    bucket = await MessageBucket.create({
      conversationId: conversation._id,
      bucketSeq: conversation.activeBucketSeq,
      count: 0,
      messages: [],
    });
  }

  // Create new message subdocument
  const messageDoc = {
    s: currentUserId,
    c: processedContent,
    t: type,
    st: "sent",
    ts: new Date(),
    m: metadata || null,
  };

  bucket.messages.push(messageDoc);
  bucket.count = bucket.messages.length;
  await bucket.save();

  const savedMessage = bucket.messages[bucket.messages.length - 1];

  // Update conversation denormalized snapshot
  const previewText = type === "img" ? "📷 Photo" : rawText.slice(0, 80);
  conversation.lastMessage = {
    senderId: currentUserId,
    previewText,
    type,
    status: "sent",
    createdAt: savedMessage.ts,
  };

  // Increment recipient unread count
  const sRecipientId = String(targetRecipientId);
  let recipientUnread = 0;
  if (conversation.unreadCounts) {
    if (typeof conversation.unreadCounts.get === "function") {
      recipientUnread = conversation.unreadCounts.get(sRecipientId) || 0;
      conversation.unreadCounts.set(sRecipientId, recipientUnread + 1);
    } else {
      recipientUnread = conversation.unreadCounts[sRecipientId] || 0;
      conversation.unreadCounts[sRecipientId] = recipientUnread + 1;
    }
  }

  await conversation.save();

  // Format client response
  const clientMessage = {
    _id: savedMessage._id,
    sender: currentUserId,
    content: rawText,
    type,
    status: "sent",
    createdAt: savedMessage.ts,
    metadata: metadata || null,
    conversationId: conversation._id,
  };

  // Real-time Socket.io delivery
  const io = req.app.get("io");
  if (io) {
    // Deliver to recipient
    io.to(`user:${sRecipientId}`).emit("chat:message_received", {
      message: clientMessage,
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
    });
    // Confirm to sender
    io.to(`user:${sUserId}`).emit("chat:message_sent", {
      message: clientMessage,
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
    });
  }

  // Create notification for recipient
  try {
    const senderUser = await User.findById(currentUserId).select("name").lean();
    const notif = await Notification.create({
      recipient: targetRecipientId,
      type: "message",
      title: senderUser?.name || "New Message",
      body: previewText,
      resource: conversation._id,
    });
    if (io) {
      io.to(`user:${sRecipientId}`).emit("notification:new", notif);
    }
  } catch (notifErr) {
    console.error("Failed to create message notification:", notifErr);
  }

  res.status(201).json({
    message: clientMessage,
    conversationId: conversation._id,
  });
});

/**
 * Quick Actions: Pin, Mute, Archive, MarkRead
 */
export const togglePin = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) return res.status(404).json({ message: "Conversation not found" });

  const idx = conv.pinnedBy.findIndex((p) => String(p) === String(userId));
  const isPinned = idx === -1;
  if (isPinned) {
    conv.pinnedBy.push(userId);
  } else {
    conv.pinnedBy.splice(idx, 1);
  }
  await conv.save();
  res.json({ conversationId, isPinned });
});

export const toggleMute = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) return res.status(404).json({ message: "Conversation not found" });

  const idx = conv.mutedBy.findIndex((p) => String(p) === String(userId));
  const isMuted = idx === -1;
  if (isMuted) {
    conv.mutedBy.push(userId);
  } else {
    conv.mutedBy.splice(idx, 1);
  }
  await conv.save();
  res.json({ conversationId, isMuted });
});

export const toggleArchive = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) return res.status(404).json({ message: "Conversation not found" });

  const idx = conv.archivedBy.findIndex((p) => String(p) === String(userId));
  const isArchived = idx === -1;
  if (isArchived) {
    conv.archivedBy.push(userId);
  } else {
    conv.archivedBy.splice(idx, 1);
  }
  await conv.save();
  res.json({ conversationId, isArchived });
});

export const markRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;
  const sUserId = String(userId);

  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) return res.status(404).json({ message: "Conversation not found" });

  if (typeof conv.unreadCounts.set === "function") {
    conv.unreadCounts.set(sUserId, 0);
  } else {
    conv.unreadCounts[sUserId] = 0;
  }
  if (conv.lastMessage && String(conv.lastMessage.senderId) !== sUserId) {
    conv.lastMessage.status = "read";
  }
  await conv.save();

  // Notify other participant
  const otherId = conv.participants.find((p) => String(p) !== sUserId);
  const io = req.app.get("io");
  if (io && otherId) {
    io.to(`user:${otherId}`).emit("chat:messages_read", {
      conversationId: String(conv._id),
      readerId: sUserId,
    });
  }

  res.json({ success: true, conversationId });
});

