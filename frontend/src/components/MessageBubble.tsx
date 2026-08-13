import { Message } from "@/lib/types";

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

export default function MessageBubble({ message, meId }: { message: Message; meId: string }) {
  const isMine = message.sender.id === meId;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 px-4`}>
      <div className={`max-w-[65%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        {!isMine && (
          <span className="text-xs text-signal-text-muted ml-1 mb-0.5">{message.sender.display_name}</span>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm ${
            isMine
              ? "bg-signal-blue text-white rounded-br-sm"
              : "bg-signal-bubble-received text-signal-text rounded-bl-sm"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <div className={`flex items-center gap-1 justify-end mt-1 ${isMine ? "text-white/70" : "text-signal-text-muted"}`}>
            <span className="text-[10px]">{formatTime(message.created_at)}</span>
            {isMine && <StatusTicks message={message} meId={meId} />}
          </div>
        </div>
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 ml-1">
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