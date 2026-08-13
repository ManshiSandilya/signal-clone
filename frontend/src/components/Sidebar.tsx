"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getConversations } from "@/lib/api";
import { clearTokens } from "@/lib/api";
import { Conversation, User } from "@/lib/types";

function conversationLabel(conv: Conversation, meId: string): string {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.participants.find((p) => p.user.id !== meId);
  return other?.user.display_name || "Unknown";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Sidebar({ me }: { me: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getConversations().then(setConversations).catch(console.error);
  }, []);

  const filtered = conversations.filter((c) =>
    conversationLabel(c, me.id).toLowerCase().includes(search.toLowerCase())
  );

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-signal-border bg-signal-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-signal-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-signal-blue flex items-center justify-center text-white font-medium text-sm">
            {me.display_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-signal-text">{me.display_name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-signal-text-muted hover:text-signal-text"
        >
          Logout
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-signal-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-signal-text-muted mt-6">No conversations yet</p>
        )}
        {filtered.map((conv) => {
          const active = pathname === `/chat/${conv.id}`;
          const label = conversationLabel(conv, me.id);
          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white transition ${
                active ? "bg-white" : ""
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-signal-blue/80 flex items-center justify-center text-white font-medium flex-shrink-0">
                {label.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-signal-text truncate">{label}</span>
                  <span className="text-xs text-signal-text-muted flex-shrink-0 ml-2">
                    {timeAgo(conv.last_activity_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs text-signal-text-muted truncate">
                    {conv.last_message?.body || "No messages yet"}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="bg-signal-blue text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}