"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getConversations } from "@/lib/api";
import { clearTokens } from "@/lib/api";
import { Conversation, User } from "@/lib/types";
import NewChatModal from "./NewChatModal";
import AddContactModal from "./AddContactModal";
import ConversationListItem from "./ConversationListItem";

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
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    function refresh() {
      getConversations().then(setConversations).catch(console.error);
    }
    refresh();
    window.addEventListener("conversations:refresh", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("conversations:refresh", refresh);
      window.removeEventListener("focus", refresh);
    };
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-signal-border relative">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-signal-blue flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {me.display_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm text-signal-text truncate">{me.display_name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full bg-signal-blue text-white flex items-center justify-center text-lg leading-none hover:bg-signal-blue-dark transition"
            title="New chat"
          >
            +
          </button>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover transition"
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute top-12 right-4 bg-white border border-signal-border rounded-lg shadow-lg py-1 w-40 z-10"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowContactModal(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-signal-text hover:bg-signal-sidebar-hover"
              >
                Add contact
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-signal-text-muted hover:bg-signal-sidebar-hover" disabled>
                Privacy
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-signal-text-muted hover:bg-signal-sidebar-hover" disabled>
                Appearance
              </button>
              <div className="border-t border-signal-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-signal-sidebar-hover"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-text-muted"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-signal-sidebar-hover rounded-full pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-signal-text-muted mt-6">No conversations yet</p>
        )}
       {filtered.map((conv) => {
          const active = pathname === `/chat/${conv.id}`;
          return (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              meId={me.id}
              isActive={active}
              onClick={() => router.push(`/chat/${conv.id}`)}
            />
          );
        })}
      </div>
      {showModal && <NewChatModal onClose={() => setShowModal(false)} />}
      {showContactModal && (
        <AddContactModal
          onClose={() => setShowContactModal(false)}
          onSuccess={() => {
            // Refresh conversations after adding contact
            getConversations().then(setConversations).catch(console.error);
          }}
        />
      )}
    </div>
  );
}