// In-memory presence map: userId (string) -> Set of socket IDs
const onlineUsers = new Map();
// In-memory last seen timestamps: userId (string) -> Date
const lastSeenMap = new Map();

export function isUserOnline(userId) {
  if (!userId) return false;
  const sockets = onlineUsers.get(String(userId));
  return Boolean(sockets && sockets.size > 0);
}

export function getUserLastSeen(userId) {
  if (!userId) return null;
  return lastSeenMap.get(String(userId)) || null;
}

export function registerChatSocketHandlers(io, socket) {
  const userId = String(socket.userId);
  if (!userId) return;

  // Track online status
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Broadcast user came online
  io.emit("presence:update", {
    userId,
    status: "online",
  });

  // Query online status for a list of user IDs
  socket.on("presence:check", (userIds, callback) => {
    if (typeof callback !== "function") return;
    if (!Array.isArray(userIds)) return callback({});
    const result = {};
    for (const id of userIds) {
      const sId = String(id);
      result[sId] = {
        isOnline: isUserOnline(sId),
        lastSeen: getUserLastSeen(sId),
      };
    }
    callback(result);
  });

  // Real-time typing indicators (strictly in-memory)
  socket.on("chat:typing", ({ conversationId, recipientId, isTyping }) => {
    if (!recipientId || !conversationId) return;
    io.to(`user:${recipientId}`).emit("chat:typing", {
      conversationId,
      senderId: userId,
      isTyping: Boolean(isTyping),
    });
  });

  // Real-time read receipt notification
  socket.on("chat:mark_read", ({ conversationId, recipientId }) => {
    if (!recipientId || !conversationId) return;
    io.to(`user:${recipientId}`).emit("chat:messages_read", {
      conversationId,
      readerId: userId,
    });
  });

  // On socket disconnect
  socket.on("disconnect", () => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        const now = new Date();
        lastSeenMap.set(userId, now);
        io.emit("presence:update", {
          userId,
          status: "offline",
          lastSeen: now,
        });
      }
    }
  });
}

