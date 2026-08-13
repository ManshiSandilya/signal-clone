import { Message } from "@/lib/types";
import { useState } from "react";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusTicks({ message, meId }: { message: Message; meId: string }) {
  const otherStatuses = message.statuses.filter((s) => s.user !== meId);
  if (otherStatuses.length === 0) return <span className="text-[10px] text-white/70">✓</span>;

  const allRead = otherStatuses.every((s) => s.status === "read");
  const allDelivered = otherStatuses.every((s) => s.status === "delivered" || s.status === "read");

  if (allRead) return <span className="text-[10px] text-blue-200">✓✓</span>;
  if (allDelivered) return <span className="text-[10px] text-white/70">✓✓</span>;
  return <span className="text-[10px] text-white/70">✓</span>;
}

export default function MessageBubble({
  message,
  meId,
  isFirstInGroup = true,
  isLastInGroup = true,
  onReact,
}: {
  message: Message;
  meId: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onReact?: (emoji: string) => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMine = message.sender.id === meId;
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

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-0.5"} px-4 group`}>
      <div className={`max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col relative`}>
        {!isMine && isFirstInGroup && (
          <span className="text-xs text-signal-text-muted ml-1 mb-0.5">{message.sender.display_name}</span>
        )}
        <div className="relative">
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm ${tailClass} ${
              isMine
                ? "bg-signal-blue text-white"
                : "bg-signal-bubble-received text-signal-text"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            {message.attachment && (
              <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                📎 Attachment: {message.attachment}
              </div>
            )}
            <div className={`flex items-center gap-1 justify-end mt-1 ${isMine ? "text-white/70" : "text-signal-text-muted"}`}>
              <span className="text-[10px]">{formatTime(message.created_at)}</span>
              {isMine && <StatusTicks message={message} meId={meId} />}
            </div>
          </div>

          {/* Reaction button - show on hover */}
          <div className={`absolute -top-2 ${isMine ? "left-0" : "right-0"} opacity-0 group-hover:opacity-100 transition`}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-white border border-signal-border rounded-full p-1.5 shadow-md hover:bg-signal-sidebar text-lg leading-none"
              title="Add reaction"
            >
              😀
            </button>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className={`absolute ${isMine ? "left-12 -top-2" : "-left-12 -top-2"} bg-white border border-signal-border rounded-lg shadow-lg p-2 z-20 flex gap-1 flex-wrap w-48`}>
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-signal-sidebar rounded transition text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 ml-1 flex-wrap">
            {message.reactions.map((r) => (
              <span key={r.id} className="text-xs bg-white border border-signal-border rounded-full px-1.5 py-0.5">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}