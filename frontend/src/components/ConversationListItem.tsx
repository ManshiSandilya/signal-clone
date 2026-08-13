"use client";

import { Conversation, Message } from "@/lib/types";

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

function ListStatusTicks({ message, meId }: { message: Message; meId: string }) {
  const otherStatuses = message.statuses.filter((s) => s.user !== meId);
  if (otherStatuses.length === 0) return <span className="text-xs text-signal-text-muted">✓</span>;

  const allRead = otherStatuses.every((s) => s.status === "read");
  const allDelivered = otherStatuses.every((s) => s.status === "delivered" || s.status === "read");

  if (allRead) return <span className="text-xs text-signal-blue font-medium">✓✓</span>;
  if (allDelivered) return <span className="text-xs text-signal-text-muted">✓✓</span>;
  return <span className="text-xs text-signal-text-muted">✓</span>;
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

  const isNoteToSelf =
    conversation.type === "direct" &&
    (conversation.participants.length === 1 ||
      !conversation.participants.some((p) => p.user.id !== meId));

  const displayName = isNoteToSelf
    ? "Note to Self"
    : conversation.type === "group"
    ? conversation.name || "Group"
    : otherParticipant?.display_name || "Unknown";

  const initial = displayName?.charAt(0).toUpperCase() || "?";
  const isOnline = conversation.type === "direct" && !isNoteToSelf && otherParticipant?.is_online;
  const unreadCount = conversation.unread_count || 0;
  const lastMessage = conversation.last_message;

  // Custom styling for Simran avatar (white background with red letter S)
  const isSimran = displayName.toLowerCase() === "simran";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center lg:gap-3 gap-2 px-3 py-2.5 rounded-lg text-left transition select-none md:justify-center lg:justify-start ${
        isActive ? "bg-signal-sidebar-active" : "hover:bg-signal-sidebar-hover"
      }`}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        {isNoteToSelf ? (
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-inner border border-signal-border">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
        ) : isSimran ? (
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-red-500 border border-signal-border font-bold text-lg">
            S
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-signal-blue/80 flex items-center justify-center text-white font-medium text-lg">
            {initial}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-signal-online border-2 border-signal-sidebar" />
        )}
      </div>

      {/* Details (Hidden on Collapsed viewports) */}
      <div className="flex-1 min-w-0 md:hidden lg:block block">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <p
              className={`text-sm truncate ${
                unreadCount > 0 ? "font-semibold text-signal-text" : "font-medium text-signal-text"
              }`}
            >
              {displayName}
            </p>
            {isNoteToSelf && (
              <span className="text-signal-blue flex-shrink-0" title="Official Chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
            )}
          </div>
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
              ? lastMessage.is_deleted
                ? "This message was deleted"
                : `${lastMessage.sender.id === meId ? "You: " : ""}${lastMessage.body}`
              : "No messages yet"}
          </p>

          {/* Unread badge or checkmark ticks */}
          {unreadCount > 0 ? (
            <span className="flex-shrink-0 bg-signal-blue text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : lastMessage && lastMessage.sender.id === meId ? (
            <ListStatusTicks message={lastMessage} meId={meId} />
          ) : null}
        </div>
      </div>
    </button>
  );
}