import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { useChatSocket } from "../../hooks/useChatSocket";
import InboxSidebar from "./InboxSidebar";
import ChatWindow from "./ChatWindow";
import NewChatModal from "./NewChatModal";

export default function ChatContainer() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);

  const recipientParam = params.get("with") || params.get("userId") || "";

  // 1. Fetch denormalized Inbox snapshot
  const { data: inboxData, isLoading: isInboxLoading } = useQuery({
    queryKey: ["/chat/inbox", activeFilter, searchQuery],
    queryFn: async () => {
      const res = await api.get("/chat/inbox", {
        params: {
          filter: activeFilter !== "all" ? activeFilter : undefined,
          q: searchQuery || undefined,
        },
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  const conversations = inboxData?.items || [];
  const counts = inboxData?.counts || { all: 0, unread: 0, pinned: 0, archived: 0 };

  // 2. Fetch or initiate conversation when ?with=<userId> is present
  useEffect(() => {
    if (!recipientParam || !user) return;
    if (recipientParam === user.id || recipientParam === user._id) {
      toast.error("You cannot message your own account");
      return;
    }

    // Skip redundant network call if this conversation is already active
    if (
      selectedParticipant &&
      (String(selectedParticipant._id) === String(recipientParam) ||
        String(selectedParticipant.id) === String(recipientParam))
    ) {
      return;
    }

    // If conversation already exists in loaded inbox items, select it directly
    const existing = conversations.find(
      (c) =>
        String(c.participant?._id) === String(recipientParam) ||
        String(c.participant?.id) === String(recipientParam)
    );
    if (existing) {
      setSelectedConversationId(existing._id);
      setSelectedParticipant(existing.participant);
      return;
    }

    let active = true;
    api
      .post("/chat/conversations", { recipientId: recipientParam })
      .then(({ data }) => {
        if (!active) return;
        const conv = data.conversation;
        setSelectedConversationId(conv._id);
        setSelectedParticipant(conv.participant);
        queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err.message || "Failed to open conversation");
      });

    return () => {
      active = false;
    };
  }, [recipientParam, user, queryClient, selectedParticipant, conversations]);

  // When clicking on an inbox item - preserve all existing searchParams (e.g. tab=inbox)
  const handleSelectConversation = (convId, participant) => {
    setSelectedConversationId(convId);
    setSelectedParticipant(participant);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("with", participant._id);
      return next;
    });
  };

  // 3. Fetch messages for active conversation
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["/chat/messages", selectedConversationId],
    queryFn: async () => {
      const res = await api.get(`/chat/conversations/${selectedConversationId}/messages`);
      return res.data;
    },
    enabled: Boolean(selectedConversationId),
  });

  const messages = messagesData?.messages || [];

  // Active selected conversation object from inbox
  const activeConv = conversations.find((c) => c._id === selectedConversationId);
  const currentParticipant = selectedParticipant || activeConv?.participant || null;

  // Real-time socket hook
  const { typingMap, onlineUserIds, emitTyping, emitMarkRead } = useChatSocket(
    selectedConversationId,
    currentParticipant?._id
  );

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ content, type, metadata }) => {
      const payload = {
        conversationId: selectedConversationId,
        recipientId: currentParticipant?._id,
        content,
        type,
        metadata,
      };
      const res = await api.post("/chat/messages", payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Optimistically append to messages query
      queryClient.setQueryData(
        ["/chat/messages", selectedConversationId],
        (old) => {
          if (!old) return { messages: [data.message] };
          return {
            ...old,
            messages: [...old.messages, data.message],
          };
        }
      );
      // Refresh inbox list
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
    },
  });

  const handleSendMessage = async (msgData) => {
    await sendMutation.mutateAsync(msgData);
  };

  // Quick Action mutations: Pin, Mute, Archive, MarkRead
  const handleTogglePin = async (convId) => {
    try {
      await api.patch(`/chat/conversations/${convId}/pin`);
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleMute = async (convId) => {
    try {
      await api.patch(`/chat/conversations/${convId}/mute`);
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleArchive = async (convId) => {
    try {
      await api.patch(`/chat/conversations/${convId}/archive`);
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      if (selectedConversationId === convId) {
        setSelectedConversationId(null);
        setSelectedParticipant(null);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("with");
          next.delete("userId");
          return next;
        });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkRead = async (convId) => {
    try {
      await api.patch(`/chat/conversations/${convId}/read`);
      queryClient.invalidateQueries({ queryKey: ["/chat/inbox"] });
      if (currentParticipant?._id) {
        emitMarkRead(convId, currentParticipant._id);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBackToInbox = () => {
    setSelectedConversationId(null);
    setSelectedParticipant(null);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("with");
      next.delete("userId");
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
            Neighborhood Real-Time Chat
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-forest">
            LocalSphere Inbox
          </h1>
        </div>

        {user?.role === "owner" && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100/90 border border-emerald-300/80 px-3.5 py-1.5 text-xs font-bold text-forest shadow-2xs">
            <ShieldAlert size={14} className="text-emerald-700" />
            <span>Store Owner Portal · Replies to customer inquiries</span>
          </div>
        )}
      </div>

      {/* Main Split-Pane Shell */}
      <div className="flex h-[calc(100vh-180px)] min-h-[580px] max-h-[820px] w-full overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111915] shadow-[0_16px_50px_-10px_rgba(22,42,32,0.07)]">
        {/* Left Column: Inbox Sidebar */}
        <div
          className={`h-full w-full md:w-[380px] shrink-0 ${selectedConversationId ? "hidden md:flex" : "flex"
            }`}
        >
          <InboxSidebar
            conversations={conversations}
            counts={counts}
            selectedConversationId={selectedConversationId}
            currentUserId={user?.id || user?._id}
            userRole={user?.role}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typingMap={typingMap}
            onlineUserIds={onlineUserIds}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setNewChatModalOpen(true)}
            onTogglePin={handleTogglePin}
            onToggleMute={handleToggleMute}
            onToggleArchive={handleToggleArchive}
            onMarkRead={handleMarkRead}
            isLoading={isInboxLoading}
          />
        </div>

        {/* Right Column: Chat Window or Empty Splash */}
        <div
          className={`h-full flex-1 ${!selectedConversationId ? "hidden md:flex" : "flex"
            }`}
        >
          {selectedConversationId && currentParticipant ? (
            <ChatWindow
              conversation={activeConv || { _id: selectedConversationId }}
              participant={currentParticipant}
              messages={messages}
              currentUserId={user?.id || user?._id}
              isOnline={
                onlineUserIds.has(String(currentParticipant._id)) ||
                Boolean(currentParticipant.isOnline)
              }
              isTyping={Boolean(typingMap[selectedConversationId]?.isTyping)}
              onBack={handleBackToInbox}
              onSendMessage={handleSendMessage}
              onTyping={emitTyping}
              onTogglePin={handleTogglePin}
              onToggleMute={handleToggleMute}
              onToggleArchive={handleToggleArchive}
              isPinned={activeConv?.isPinned}
              isMuted={activeConv?.isMuted}
              isArchived={activeConv?.isArchived}
              isLoading={isMessagesLoading}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#f8f9f7] dark:bg-[#0c1310]">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white dark:bg-[#16221c] text-emerald-700 dark:text-emerald-400 mb-4 shadow-xs border border-slate-200/80 dark:border-white/[0.08]">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Select a conversation
              </h3>
              <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a chat from the inbox on the left, or visit any neighborhood shop profile to message the shop owner directly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Shop Selector Modal */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onSelectOwner={(ownerId) => {
          setParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("with", ownerId);
            return next;
          });
        }}
      />
    </div >
  );
}
