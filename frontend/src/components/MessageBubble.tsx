import { Message } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { deleteMessage } from "@/lib/api";

function formatBubbleTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function StatusTicks({ message, meId }: { message: Message; meId: string }) {
  const otherStatuses = message.statuses.filter((s) => s.user !== meId);
  if (otherStatuses.length === 0) return <span className="text-[10px] text-white/70">✓</span>;

  const allRead = otherStatuses.every((s) => s.status === "read");
  const allDelivered = otherStatuses.every((s) => s.status === "delivered" || s.status === "read");

  if (allRead) return <span className="text-[10px] text-blue-300">✓✓</span>;
  if (allDelivered) return <span className="text-[10px] text-white/70">✓✓</span>;
  return <span className="text-[10px] text-white/70">✓</span>;
}

export default function MessageBubble({
  message,
  meId,
  isFirstInGroup = true,
  isLastInGroup = true,
  onReact,
  onRemoveReact,
  onDeleted,
}: {
  message: Message;
  meId: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onReact?: (emoji: string) => void;
  onRemoveReact?: () => void;
  onDeleted?: () => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const isMine = message.sender.id === meId;
  const isDeleted = message.is_deleted;
  const isSystemMessage = message.body.startsWith("🕒 ");

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-3 px-4 w-full select-none">
        <p className="text-xs font-medium text-signal-text-muted bg-signal-sidebar/50 px-3 py-1.5 rounded-lg text-center max-w-[80%]">
          {message.body}
        </p>
      </div>
    );
  }

  const tailClass = isLastInGroup
    ? isMine
      ? "rounded-br-sm"
      : "rounded-bl-sm"
    : isMine
    ? "rounded-br-2xl"
    : "rounded-bl-2xl";

  const reactions = ["😂", "😮", "😢", "😡", "👍", "👎", "❤️"];

  function handleReaction(emoji: string) {
    if (onReact) {
      onReact(emoji);
    }
    setShowEmojiPicker(false);
  }

  async function handleDeleteClick() {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setDeleting(true);
    try {
      await deleteMessage(message.id);
      if (onDeleted) onDeleted();
    } catch (err) {
      alert("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-0.5"} px-4 group`}>
      <div className={`max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col relative`}>
        {/* Sender Name */}
        {!isMine && isFirstInGroup && (
          <span className="text-xs text-signal-text-muted ml-1 mb-0.5">{message.sender.display_name}</span>
        )}
        
        {/* Bubble Area */}
        <div className="relative">
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm ${tailClass} ${
              isDeleted
                ? "bg-signal-bubble-received border border-signal-border text-signal-text-muted italic"
                : isMine
                ? "bg-signal-bubble-sent text-signal-bubble-sent-text"
                : "bg-signal-bubble-received text-signal-bubble-received-text"
            }`}
          >
            {isDeleted ? (
              <span className="flex items-center gap-1.5 opacity-80">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                This message was deleted
              </span>
            ) : (
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                  {message.attachment && (
                    <div className="mt-2 p-2 bg-black/20 rounded-lg text-xs flex items-center gap-2 border border-signal-border">
                      <span>📎</span>
                      <a
                        href={message.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline font-medium text-signal-blue truncate max-w-xs"
                      >
                        {message.attachment.split("/").pop() || "Attached File"}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Inline Time and checkmark ticks */}
                <div className={`flex items-center gap-1 text-[10px] opacity-75 self-end flex-shrink-0 select-none mb-[-2px]`}>
                  <span>{formatBubbleTime(message.created_at)}</span>
                  {isMine && <StatusTicks message={message} meId={meId} />}
                </div>
              </div>
            )}
          </div>

          {/* Action Overlay */}
          {!isDeleted && (
            <div className={`absolute -top-3.5 ${isMine ? "-left-16" : "-right-16"} opacity-0 group-hover:opacity-100 transition z-10 flex items-center gap-1`}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="bg-signal-panel border border-signal-border hover:bg-signal-sidebar-hover rounded-full p-1.5 shadow-lg text-sm leading-none transition cursor-pointer"
                title="Add reaction"
              >
                😀
              </button>

              {isMine && (
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="bg-signal-panel border border-signal-border hover:bg-signal-sidebar-hover hover:text-signal-danger text-signal-text-muted rounded-full p-1.5 shadow-lg text-sm leading-none transition cursor-pointer"
                  title="Delete message"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Emoji Picker (Positioned to expand inside viewport to prevent cutoff) */}
          {showEmojiPicker && !isDeleted && (
            <div ref={reactionPickerRef} className={`absolute ${isMine ? "right-0 -top-14" : "left-0 -top-14"} bg-signal-panel border border-signal-border rounded-xl shadow-2xl p-1.5 z-20 flex gap-0.5 flex-nowrap w-auto whitespace-nowrap`}>
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-signal-sidebar-hover rounded-lg transition text-lg cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction Chips */}
        {message.reactions.length > 0 && !isDeleted && (
          <div className="flex gap-1 mt-1 ml-1 flex-wrap">
            {message.reactions.map((r) => {
              const isMyReaction = r.user.id === meId;
              return (
                <button
                  key={r.id}
                  onClick={() => isMyReaction && onRemoveReact && onRemoveReact()}
                  className={`text-xs border rounded-full px-2 py-0.5 transition cursor-pointer ${
                    isMyReaction
                      ? "bg-signal-blue/20 border-signal-blue text-signal-blue"
                      : "bg-signal-panel border-signal-border text-signal-text"
                  }`}
                  title={isMyReaction ? "Click to remove reaction" : `Reacted by ${r.user.display_name}`}
                >
                  {r.emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}