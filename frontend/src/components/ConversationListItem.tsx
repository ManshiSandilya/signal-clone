"use client";

import { Conversation } from "@/lib/types";

function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const isThisWeek = now.getTime() - date.getTime() < 6 * 24 * 60 * 60 * 1000;
  if (isThisWeek) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationListItem({
  conversation,
  meId,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  meId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.user.id !== meId)?.user
      : undefined;

  const displayName = conversation.type === "group" ? conversation.name : otherParticipant?.display_name || "Unknown";
  const initial = displayName?.charAt(0).toUpperCase() || "?";
  const isOnline = conversation.type === "direct" && otherParticipant?.is_online;
  const unreadCount = conversation.unread_count || 0;
  const lastMessage = conversation.last_message;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
        isActive ? "bg-signal-sidebar-active" : "hover:bg-signal-sidebar-hover"
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-signal-blue/80 flex items-center justify-center text-white font-medium text-lg">
          {initial}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-signal-online border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm truncate ${
              unreadCount > 0 ? "font-semibold text-signal-text" : "font-medium text-signal-text"
            }`}
          >
            {displayName}
          </p>
          {lastMessage && (
            <span
              className={`text-xs flex-shrink-0 ${
                unreadCount > 0 ? "text-signal-blue font-medium" : "text-signal-text-muted"
              }`}
            >
              {formatListTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-xs truncate ${
              unreadCount > 0 ? "text-signal-text font-medium" : "text-signal-text-muted"
            }`}
          >
            {lastMessage
              ? `${lastMessage.sender.id === meId ? "You: " : ""}${lastMessage.body}`
              : "No messages yet"}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 bg-signal-blue text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}