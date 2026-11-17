import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";

export function useChatSocket(activeConversationId, activeRecipientId) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  // Map of conversationId -> { isTyping: boolean, senderId: string }
  const [typingMap, setTypingMap] = useState({});
  // Set of online user IDs
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  // Typing timeout ref for debouncing
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Check presence for active recipient if any
      if (activeRecipientId) {
        socket.emit("presence:check", [activeRecipientId], (result) => {
          if (result && result[activeRecipientId]?.isOnline) {
            setOnlineUserIds((prev) => new Set(prev).add(String(activeRecipientId)));
          }
        });
      }
    });

    // Real-time incoming message
    socket.on("chat:message_received", (payload) => {
      // Invalidate inbox list
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      // Invalidate active conversation messages if matches
      if (payload.conversationId === activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["/chat/messages", payload.conversationId],
        });
        // Auto mark as read
        if (activeRecipientId) {
          socket.emit("chat:mark_read", {
            conversationId: payload.conversationId,
            recipientId: activeRecipientId,
          });
        }
      }
    });

    // Message sent confirmation
    socket.on("chat:message_sent", (payload) => {
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      if (payload.conversationId === activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["/chat/messages", payload.conversationId],
        });
      }
    });

    // Real-time typing indicators
    socket.on("chat:typing", ({ conversationId, senderId, isTyping }) => {
      setTypingMap((prev) => ({
        ...prev,
        [conversationId]: { isTyping, senderId },
      }));
    });

    // Real-time read receipt
    socket.on("chat:messages_read", ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      if (conversationId === activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["/chat/messages", conversationId],
        });
      }
    });

    // Real-time presence updates
    socket.on("presence:update", ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
      // Invalidate inbox to refresh online dots
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, activeConversationId, activeRecipientId, queryClient]);

  // Function to emit typing status with auto-stop after 2 seconds
  const emitTyping = useCallback(
    (conversationId, recipientId, isTyping = true) => {
      if (!socketRef.current || !conversationId || !recipientId) return;

      socketRef.current.emit("chat:typing", {
        conversationId,
        recipientId,
        isTyping,
      });

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.emit("chat:typing", {
              conversationId,
              recipientId,
              isTyping: false,
            });
          }
        }, 2500);
      }
    },
    []
  );

  // Function to emit read status
  const emitMarkRead = useCallback((conversationId, recipientId) => {
    if (!socketRef.current || !conversationId || !recipientId) return;
    socketRef.current.emit("chat:mark_read", { conversationId, recipientId });
  }, []);

  return {
    socket: socketRef.current,
    typingMap,
    onlineUserIds,
    emitTyping,
    emitMarkRead,
  };
}

