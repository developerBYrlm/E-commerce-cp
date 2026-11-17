import { useState } from "react";
import { Search, X, MessageSquarePlus, MessageSquare } from "lucide-react";
import InboxItem from "./InboxItem";

export default function InboxSidebar({
  conversations = [],
  counts = { all: 0, unread: 0, pinned: 0, archived: 0 },
  selectedConversationId,
  currentUserId,
  userRole,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  typingMap = {},
  onlineUserIds = new Set(),
  onSelectConversation,
  onOpenNewChat,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onMarkRead,
  isLoading,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    setSearchQuery(val);
  };

  const clearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  const filterTabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "unread", label: "Unread", count: counts.unread },
    { id: "pinned", label: "Pinned", count: counts.pinned },
    { id: "archived", label: "Archived", count: counts.archived },
  ];

  return (
        <aside className="flex h-full w-full flex-col border-r border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#111915]">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  Inbox
                </h2>
                <p className="text-[11px] font-semibold text-slate-400">
                  {counts.all} conversation{counts.all !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

          {/* New Chat Button (For Customers) */}
          {userRole !== "owner" && (
            <button
              type="button"
              onClick={onOpenNewChat}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition hover:scale-102 active:scale-95"
              title="Start new conversation with a shop"
            >
              <MessageSquarePlus size={14} />
              <span>New Chat</span>
            </button>
          )}
      </div>

      {/* Instant Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, shop or message…"
            className="w-full rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16221c] py-2 pl-9 pr-8 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-600 dark:focus:border-emerald-500/60 focus:bg-white dark:focus:bg-[#1a2922] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
          />
          {localSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#16221c] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#1c2c24]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
              );
        })}
      </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 dark:bg-[#263c31] text-slate-400 dark:text-cream/50 mb-3">
                <MessageSquare size={20} />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-cream">
                {activeFilter === "unread"
                  ? "No unread messages"
                  : activeFilter === "pinned"
                    ? "No pinned conversations"
                    : activeFilter === "archived"
                      ? "No archived conversations"
                      : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                {userRole === "owner"
                  ? "When customers send inquiries to your shop, their conversations will appear here."
                  : "Browse neighborhood shops and click 'Message' to chat with verified shop owners!"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isTyping = Boolean(typingMap[conv._id]?.isTyping);
              const otherUserId = String(conv.participant._id);
              const isOnline = onlineUserIds.has(otherUserId) || Boolean(conv.participant.isOnline);

              return (
                <InboxItem
                  key={conv._id}
                  conversation={conv}
                  isSelected={conv._id === selectedConversationId}
                  currentUserId={currentUserId}
                  isTyping={isTyping}
                  isOnline={isOnline}
                  onSelect={() => onSelectConversation(conv._id, conv.participant)}
                  onTogglePin={onTogglePin}
                  onToggleMute={onToggleMute}
                  onToggleArchive={onToggleArchive}
                  onMarkRead={onMarkRead}
                />
              );
            })
          )}
        </div>
    </aside>
  );
}
