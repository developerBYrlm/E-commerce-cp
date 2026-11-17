import { useMemo, useState } from "react";
import { Check, CheckCheck, MoreVertical, Pin, VolumeX, Archive, Eye, ShoppingBag } from "lucide-react";
import { getImageUrl } from "../../utils/imageUrl";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function InboxItem({
  conversation,
  isSelected,
  currentUserId,
  isTyping,
  isOnline,
  onSelect,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  onMarkRead,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { participant, lastMessage, unreadCount, isPinned, isMuted, isArchived, _id } = conversation;

  // Check for unsent draft in localStorage
  const draft = useMemo(() => {
    try {
      return localStorage.getItem(`chat_draft_${_id}`) || "";
    } catch {
      return "";
    }
  }, [_id]);

  const isOutgoing = lastMessage && String(lastMessage.senderId) === String(currentUserId);
  const avatarUrl = participant.avatar ? getImageUrl(participant.avatar, "customers") : "";

  return (
    <div
      onClick={onSelect}
      className={`group relative flex cursor-pointer items-center gap-3.5 border-b border-slate-100 dark:border-white/[0.06] p-3.5 transition-all duration-200 select-none ${isSelected
        ? "bg-emerald-50/70 dark:bg-[#182620] border-l-4 border-l-emerald-600 dark:border-l-emerald-400"
        : "hover:bg-slate-50 dark:hover:bg-[#15221b] bg-white dark:bg-[#111a15]"
        }`}
    >
      {/* Avatar Container with Online Indicator */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={participant.name}
            className="h-11 w-11 rounded-full object-cover shadow-xs ring-1 ring-slate-200/80 dark:ring-white/10"
          />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-800/80 text-emerald-800 dark:text-emerald-100 font-bold text-sm shadow-xs">
            {participant.name?.slice(0, 1)?.toUpperCase() || "U"}
          </div>
        )}

        {/* Live Pulse Online Dot */}
        {isOnline && (
          <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#111a15] bg-emerald-500" />
          </span>
        )}
      </div>

      {/* Center Details */}
      <div className="min-w-0 flex-1">
        {/* Top Line: Name & Time */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            <h4 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {participant.name}
            </h4>
            {isPinned && <Pin size={11} className="shrink-0 fill-amber-500 text-amber-500" />}
            {isMuted && <VolumeX size={12} className="shrink-0 text-slate-400" />}
          </div>
          <time className="shrink-0 text-[11px] font-medium text-slate-400">
            {formatRelativeTime(lastMessage?.createdAt || conversation.updatedAt)}
          </time>
        </div>

        {/* Second Line: Shop badge if owner */}
        {participant.shop && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShoppingBag size={11} className="shrink-0" />
            <span className="truncate">{participant.shop.name}</span>
          </div>
        )}

        {/* Third Line: Message preview or Typing indicator or Draft */}
        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          {isTyping ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="italic ml-0.5">typing...</span>
            </span>
          ) : draft ? (
            <span className="truncate text-amber-600 dark:text-amber-400 font-medium">
              <span className="font-bold">Draft:</span> {draft}
            </span>
          ) : (
            <div className="flex min-w-0 items-center gap-1 text-slate-500 dark:text-slate-400">
              {isOutgoing && (
                <span className="shrink-0">
                  {lastMessage.status === "read" ? (
                    <CheckCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <Check size={14} className="text-slate-400" />
                  )}
                </span>
              )}
              <span
                className={`truncate ${unreadCount > 0 ? "font-bold text-slate-900 dark:text-white" : ""
            }`}
              >
          {lastMessage?.type === "img" ? "📷 Photo" : lastMessage?.previewText || "Started a conversation"}
        </span>
      </div>
          )}

    {/* Unread Badge Pill */ }
  {
    unreadCount > 0 && (
      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-extrabold text-white shadow-xs">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )
  }
        </div >
      </div >

        {/* Hover Quick Actions Button */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Conversation options"
          >
            <MoreVertical size={15} />
          </button>

        {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-44 rounded-2xl bg-white dark:bg-[#16241e] p-1.5 shadow-xl border border-slate-200/80 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onTogglePin?.(_id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f322a]"
                >
                  <Pin size={13} className={isPinned ? "text-amber-500" : ""} />
                  {isPinned ? "Unpin chat" : "Pin to top"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMute?.(_id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f322a]"
                >
                  <VolumeX size={13} />
                  {isMuted ? "Unmute alerts" : "Mute conversation"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleArchive?.(_id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f322a]"
                >
                  <Archive size={13} />
                  {isArchived ? "Unarchive" : "Archive chat"}
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkRead?.(_id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1f322a]"
                  >
                    <Eye size={13} />
                    Mark as read
                  </button>
                )}
              </div>
            </>
          )}
        </div>
    </div >
  );
}
