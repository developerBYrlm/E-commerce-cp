import { useState, useRef, useEffect } from "react";
import { Send, Image, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/client";

export default function MessageInput({
  conversationId,
  recipientId,
  onSendMessage,
  onTyping,
  disabled,
}) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Restore draft when conversation changes
  useEffect(() => {
    if (!conversationId) return;
    try {
      const savedDraft = localStorage.getItem(`chat_draft_${conversationId}`) || "";
      setText(savedDraft);
    } catch {
      setText("");
    }
    setSelectedFile(null);
    setPreviewUrl("");
  }, [conversationId]);

  // Adjust textarea height dynamically per new line without any scrollbar
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    try {
      if (val.trim()) {
        localStorage.setItem(`chat_draft_${conversationId}`, val);
      } else {
        localStorage.removeItem(`chat_draft_${conversationId}`);
      }
    } catch {
      // ignore storage error
    }
    // Emit typing indicator
    if (conversationId && recipientId) {
      onTyping?.(conversationId, recipientId, true);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file must be under 10MB");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || uploading || disabled) return;

    let imageUrl = null;
    let messageType = "text";

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const { data: uploadRes } = await api.post("/uploads/image", formData);
        imageUrl = uploadRes.url;
        messageType = "img";
      } catch (err) {
        toast.error("Image upload failed: " + (err.message || "Unknown error"));
        setUploading(false);
        return;
      }
    }

    // Call send message handler
    try {
      await onSendMessage({
        content: imageUrl ? (trimmed || "📷 Photo") : trimmed,
        type: messageType,
        metadata: imageUrl ? { url: imageUrl, fileName: selectedFile?.name } : null,
      });

      // Clear input & draft
      setText("");
      removeSelectedFile();
      try {
        localStorage.removeItem(`chat_draft_${conversationId}`);
      } catch {
        // ignore
      }
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#111915] p-3 sm:p-3.5">
      {/* Image Preview Thumbnail */}
      {previewUrl && (
        <div className="relative mb-2.5 inline-block rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-1 bg-slate-50 dark:bg-[#16221c]">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="h-20 w-20 rounded-xl object-cover shadow-xs"
          />
          <button
            type="button"
            onClick={removeSelectedFile}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow-md hover:bg-black transition"
            title="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input Action Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Media Button: Always centered in the middle */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="flex h-10 w-10 shrink-0 self-center items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#16221c] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#1e2e26] border border-transparent dark:border-white/[0.06] transition disabled:opacity-50"
          title="Attach photo"
        >
          <Image size={18} />
        </button>

        {/* Text Input: auto-growing per line, no scrollbar */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || uploading}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            style={{ overflow: "hidden" }}
            className={`w-full resize-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16221c] py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-[11px] sm:placeholder:text-xs placeholder:tracking-tight placeholder-slate-400 placeholder:dark:text-slate-500 focus:border-emerald-600 dark:focus:border-emerald-500/60 focus:bg-white dark:focus:bg-[#1a2922] focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition leading-relaxed ${!text ? "whitespace-nowrap" : "whitespace-pre-wrap"
              }`}
          />
        </div>

        {/* Send Button: Always centered in the middle */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || uploading || disabled}
          className="flex h-10 w-10 shrink-0 self-center items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          title="Send message"
        >
          {uploading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div >
  );
}
