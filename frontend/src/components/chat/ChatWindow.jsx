import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Pin,
  VolumeX,
  Archive,
  ShoppingBag,
  Check,
  CheckCheck,
  ExternalLink,
  X,
} from "lucide-react";
import MessageInput from "./MessageInput";
import { getImageUrl } from "../../utils/imageUrl";

function formatDateSeparator(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatMessageTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatWindow({
  conversation,
  participant,
  messages = [],
  currentUserId,
  isOnline,
  isTyping,
  onBack,
  onSendMessage,
  onTyping,
  onTogglePin,
  onToggleMute,
  onToggleArchive,
  isPinned,
  isMuted,
  isArchived,
  isLoading,
}) {
  const messageContainerRef = useRef(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Auto-scroll to bottom of the CHAT CONTAINER ONLY (never scroll the browser window)
  useEffect(() => {
      const el = messageContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, [messages, isTyping]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    for (const msg of messages) {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = msgDate;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    return groups;
  }, [messages]);

  const avatarUrl = participant?.avatar ? getImageUrl(participant.avatar, "customers") : "";
  const lastOutgoingMessage = [...messages]
    .reverse()
    .find((m) => String(m.sender) === String(currentUserId));

  return (
      <section className="flex h-full w-full flex-col bg-[#f8f9f7] dark:bg-[#0c1310]">
        {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#111915] px-5 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button on mobile */}
              <button
                type="button"
                onClick={onBack}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#16221c] text-slate-700 dark:text-slate-200 border border-transparent dark:border-white/[0.06]"
                title="Back to conversations"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Participant Avatar */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={participant?.name || "Participant"}
                    className="h-10 w-10 rounded-full object-cover shadow-xs ring-1 ring-black/5"
                  />
                ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-800/80 text-emerald-800 dark:text-emerald-100 font-bold text-sm shadow-xs">
                      {participant?.name?.slice(0, 1)?.toUpperCase() || "U"}
                    </div>
            )}
                    {/* Online Indicator */}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center">
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#111915] bg-emerald-500" />
                      </span>
                    )}
                  </div>

          {/* Participant Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                      <h3 className="truncate font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {participant?.name || "Local Neighbor"}
                      </h3>
                      {isPinned && <Pin size={11} className="fill-amber-500 text-amber-500 shrink-0" />}
                      {isMuted && <VolumeX size={12} className="text-slate-400 shrink-0" />}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {participant?.shop ? (
                      <Link
                        to={`/shops/${participant.shop.slug || participant.shop._id}`}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate"
                      >
                        <ShoppingBag size={11} className="shrink-0" />
                        <span className="truncate">{participant.shop.name}</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                        />
                        <span>{isOnline ? "Active now" : "Offline"}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Header Actions */}
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => onTogglePin?.(conversation?._id)}
                  className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#16221c] transition ${isPinned ? "text-amber-500" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  title={isPinned ? "Unpin chat" : "Pin chat"}
                >
                  <Pin size={16} className={isPinned ? "fill-amber-500" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMute?.(conversation?._id)}
                  className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#16221c] transition ${isMuted ? "text-red-500" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  title={isMuted ? "Unmute alerts" : "Mute alerts"}
                >
                  <VolumeX size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleArchive?.(conversation?._id)}
                  className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#16221c] transition ${isArchived ? "text-emerald-600" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  title={isArchived ? "Unarchive chat" : "Archive chat"}
                >
                  <Archive size={16} />
                </button>
              </div>
            </div>

            {/* Message Stream Container */}
            <div
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain"
            >
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} animate-pulse`}
                    >
                      <div
                        className={`h-11 w-44 rounded-2xl ${i % 2 === 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white dark:bg-[#16221c] text-emerald-700 dark:text-emerald-400 mb-3 shadow-xs border border-slate-200/60 dark:border-white/[0.08]">
                      <ShoppingBag size={24} />
                    </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Start the conversation
                      </p>
                        <p className="mt-1 text-xs max-w-xs text-slate-500 dark:text-slate-400">
                          Inquire about products, pricing, delivery options, or custom requests.
                        </p>
                      </div>
                      ) : (
          groupedMessages.map((group) => (
                      <div key={group.date} className="space-y-3">
                        {/* Date Separator Pill */}
                        <div className="flex justify-center my-2">
                            <span className="rounded-full bg-white dark:bg-[#16221c] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 shadow-xs backdrop-blur-xs">
                              {formatDateSeparator(group.date)}
                            </span>
                        </div>

                        {/* Messages in this date */}
                        {group.messages.map((message) => {
                          const isMine = String(message.sender) === String(currentUserId);
                          const hasMedia = message.type === "img" || message.metadata?.url;
                          const mediaUrl = message.metadata?.url || (message.type === "img" ? message.content : null);

                          return (
                            <div
                              key={message._id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`relative max-w-[82%] sm:max-w-[70%] px-4 py-2.5 transition ${isMine
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl rounded-br-xs shadow-sm"
                                    : "bg-white dark:bg-[#16221c] text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-xs border border-slate-200/80 dark:border-white/[0.08] shadow-xs"
                                  }`}
                              >
                                {/* Media Image Attachment */}
                                {hasMedia && mediaUrl && (
                                  <div className="mb-2 overflow-hidden rounded-xl">
                                    <img
                                      src={getImageUrl(mediaUrl, "customers")}
                                      alt="Attachment"
                                      onClick={() => setLightboxUrl(getImageUrl(mediaUrl, "customers"))}
                                      className="max-h-64 w-full cursor-zoom-in object-cover transition hover:scale-102"
                                    />
                                  </div>
                                )}

                                {/* Text Content */}
                                {message.content && (!hasMedia || message.content !== "📷 Photo") && (
                                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
                                    {message.content}
                                  </p>
                                )}

                                {/* Footer: Time + Status Ticks */}
                                <div
                                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? "text-emerald-100/75" : "text-slate-400"
                                    }`}
                                >
                                  <time>{formatMessageTime(message.createdAt)}</time>
                                  {isMine && (
                                    <span>
                                      {message.status === "read" ? (
                              <CheckCheck size={13} className="text-emerald-200" />
                                      ) : (
                                        <Check size={13} className="text-emerald-200/80" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      ))
        )}

                      {/* Live Typing Indicator Bubble */}
                      {isTyping && (
                        <div className="flex justify-start">
                              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-white dark:bg-[#16221c] px-4 py-2.5 text-xs text-slate-600 dark:text-slate-200 shadow-xs border border-slate-200/80 dark:border-white/[0.08]">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {participant?.name || "Participant"} is typing
                                </span>
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                              </div>
                          </div>
        )}

                          {/* "Seen" marker for last outgoing message */}
                          {lastOutgoingMessage && lastOutgoingMessage.status === "read" && !isTyping && (
                            <div className="flex justify-end pr-1">
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCheck size={12} /> Seen
                                </span>
                            </div>
                          )}
                        </div>

      {/* Message Input Bar */}
                      <MessageInput
                        conversationId={conversation?._id}
                        recipientId={participant?._id}
                        onSendMessage={onSendMessage}
                        onTyping={onTyping}
                        disabled={isLoading}
                      />

                      {/* Image Lightbox Modal */}
                      {lightboxUrl && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                          onClick={() => setLightboxUrl(null)}
                        >
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(null)}
                            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-black/40"
                          >
                            <X size={24} />
                          </button>
                          <img
                            src={lightboxUrl}
                            alt="Full preview"
                            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </section>
                    );
}
