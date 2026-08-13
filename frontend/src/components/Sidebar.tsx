"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getConversations, clearTokens } from "@/lib/api";
import { Conversation, User } from "@/lib/types";
import NewChatModal from "./NewChatModal";
import AddContactModal from "./AddContactModal";
import ConversationListItem from "./ConversationListItem";
import { useChat } from "@/lib/ChatContext";

function conversationLabel(conv: Conversation, meId: string): string {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.participants.find((p) => p.user.id !== meId);
  return other?.user.display_name || "Unknown";
}

export default function Sidebar({ me }: { me: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "calls" | "stories">("chats");

  // Retrieve settings state from ChatContext
  const { showSettings, setShowSettings, activeSettingsTab, setActiveSettingsTab } = useChat();

  // Determine if we are on a conversation page (mobile hide sidebar)
  const isChatOpen = pathname !== "/chat";

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

  function handleChatsTabClick() {
    setShowSettings(false);
    setActiveTab("chats");
  }

  return (
    <div className={`h-full flex-shrink-0 flex border-r border-signal-border lg:w-[360px] md:w-[84px] ${isChatOpen ? "hidden md:flex" : "w-full"}`}>
      {/* ── Left Navigation Strip (Signal Style) ────────────────────────── */}
      <div className="w-16 bg-signal-nav flex flex-col items-center justify-between py-4 border-r border-signal-border flex-shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Hamburger Menu / Profile */}
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition cursor-pointer"
            title="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Active Chats Tab */}
          <button
            onClick={handleChatsTabClick}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition relative cursor-pointer ${
              activeTab === "chats" && !showSettings
                ? "bg-signal-sidebar-active text-signal-blue"
                : "text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text"
            }`}
            title="Chats"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>

          {/* Calls Tab (Placeholder) */}
          <button
            onClick={() => {
              setShowSettings(false);
              setActiveTab("calls");
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === "calls" && !showSettings
                ? "bg-signal-sidebar-active text-signal-blue"
                : "text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text"
            }`}
            title="Calls (Placeholder)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>

          {/* Stories Tab (Placeholder) */}
          <button
            onClick={() => {
              setShowSettings(false);
              setActiveTab("stories");
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              activeTab === "stories" && !showSettings
                ? "bg-signal-sidebar-active text-signal-blue"
                : "text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text"
            }`}
            title="Stories (Placeholder)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="5" width="11" height="15" rx="3" />
              <path d="M4 9a3 3 0 0 1 3-3h1" />
              <path d="M4 13a3 3 0 0 1 3-3" />
            </svg>
          </button>

        </div>

        {/* Bottom Gear Icon */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition cursor-pointer ${
              showSettings
                ? "bg-signal-sidebar-active text-signal-blue"
                : "text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text"
            }`}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {showMenu && (
            <div
              className="absolute bottom-12 left-2 bg-signal-panel border border-signal-border rounded-lg shadow-lg py-1 w-48 z-20 text-sm"
              onMouseLeave={() => setShowMenu(false)}
            >
              <div className="px-3 py-2 border-b border-signal-border">
                <p className="text-xs text-signal-text-muted">Signed in as</p>
                <p className="text-sm font-semibold text-signal-text truncate">{me.display_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowContactModal(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-signal-text hover:bg-signal-sidebar-hover transition"
              >
                Add contact
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-signal-text-muted hover:bg-signal-sidebar-hover transition" disabled>
                Preferences
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-signal-text-muted hover:bg-signal-sidebar-hover transition" disabled>
                Keyboard shortcuts
              </button>
              <div className="border-t border-signal-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-signal-sidebar-hover transition font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Middle Panel: Chats / Content ─────────────────────────────── */}
      <div className="flex-1 bg-signal-sidebar flex flex-col h-full min-w-0">
        {showSettings ? (
          /* Settings Mode Sidebar Menu */
          <>
            <div className="flex items-center px-5 py-4 flex-shrink-0">
              <h1 className="text-xl font-bold text-signal-text">Settings</h1>
            </div>

            {/* User Profile Header */}
            <div className="px-5 pb-4 flex items-center gap-3 border-b border-signal-border flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base shadow-inner">
                {me.display_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-signal-text truncate">{me.display_name}</p>
                <p className="text-xs text-signal-text-muted truncate">{me.phone_or_username}</p>
              </div>
            </div>

            {/* Settings Categories List */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
              {[
                { id: "general", label: "General", icon: "⚙️" },
                { id: "appearance", label: "Appearance", icon: "🎨" },
                { id: "chats", label: "Chats", icon: "💬" },
                { id: "calls", label: "Calls", icon: "📞" },
                { id: "notifications", label: "Notifications", icon: "🔔" },
                { id: "privacy", label: "Privacy", icon: "🔒" },
                { id: "data", label: "Data usage", icon: "🌐" },
                { id: "backups", label: "Backups", icon: "⏰" },
                { id: "donate", label: "Donate to Signal", icon: "❤️" },
              ].map((item) => {
                const active = activeSettingsTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSettingsTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition select-none text-sm cursor-pointer ${
                      active
                        ? "bg-signal-sidebar-active text-signal-text font-semibold"
                        : "text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* Normal Chats Mode Sidebar Menu */
          <>
            {/* Header */}
            <div className="flex items-center lg:justify-between justify-center px-5 py-4 flex-shrink-0 lg:flex-row md:flex-col gap-3">
              <h1 className="text-xl font-bold text-signal-text lg:block md:hidden block">Chats</h1>
              <div className="flex lg:flex-row md:flex-col flex-row items-center gap-1">
                {/* Compose / New Chat button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="w-8 h-8 rounded-lg text-signal-text hover:bg-signal-sidebar-hover flex items-center justify-center transition cursor-pointer"
                  title="New chat"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Three dots menu button next to compose */}
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-8 h-8 rounded-lg text-signal-text hover:bg-signal-sidebar-hover flex items-center justify-center transition cursor-pointer"
                  title="Add contact"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="6" cy="12" r="1.5" />
                    <circle cx="18" cy="12" r="1.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="px-4 pb-3 flex-shrink-0 lg:flex md:hidden flex items-center gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-signal-text-muted"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-signal-input text-signal-text rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue border border-transparent focus:border-signal-blue"
                />
              </div>
              {/* Sliders filter button next to search */}
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition flex-shrink-0 cursor-pointer border border-signal-border bg-signal-input"
                title="Filter chats"
                onClick={() => alert("Filter chats - Coming Soon!")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center lg:block md:hidden block">
                  <p className="text-sm font-semibold text-signal-text">No chats</p>
                  <p className="text-xs text-signal-text-muted mt-1">Recent chats will appear here.</p>
                </div>
              ) : (
                filtered.map((conv) => {
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
                })
              )}
            </div>
          </>
        )}

        {activeTab === "calls" && !showSettings && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:block md:hidden block">
            <p className="text-sm font-semibold text-signal-text">No calls</p>
            <p className="text-xs text-signal-text-muted mt-1">Recent calls and options will show here.</p>
          </div>
        )}

        {activeTab === "stories" && !showSettings && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:block md:hidden block">
            <p className="text-sm font-semibold text-signal-text">Stories</p>
            <p className="text-xs text-signal-text-muted mt-1">Stories from your contacts will show here.</p>
          </div>
        )}
      </div>

      {showModal && <NewChatModal onClose={() => setShowModal(false)} />}
      {showContactModal && (
        <AddContactModal
          onClose={() => setShowContactModal(false)}
          onSuccess={() => {
            getConversations().then(setConversations).catch(console.error);
          }}
        />
      )}
    </div>
  );
}