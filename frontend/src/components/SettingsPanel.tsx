"use client";

import { useChat } from "@/lib/ChatContext";

export default function SettingsPanel() {
  const { setShowSettings, activeSettingsTab } = useChat();

  function renderContent() {
    switch (activeSettingsTab) {
      case "chats":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4">
            <p className="text-xs text-signal-text-muted mb-6">
              Organize your chats into folders and quickly switch between them on your chat list
            </p>

            {/* Folders Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-signal-text mb-4">Folders</h3>
              <div className="space-y-4">
                {/* Create a folder */}
                <button
                  onClick={() => alert("Creating folder...")}
                  className="flex items-center gap-4 text-sm font-medium hover:text-signal-blue transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-signal-sidebar-hover flex items-center justify-center text-signal-text group-hover:bg-signal-blue/20 group-hover:text-signal-blue transition">
                    <span className="text-xl font-light">+</span>
                  </div>
                  <span>Create a folder</span>
                </button>

                {/* All chats */}
                <div className="flex items-center gap-4 text-sm font-medium text-signal-text">
                  <div className="w-9 h-9 rounded-full bg-signal-sidebar-hover flex items-center justify-center text-signal-text-muted">
                    📁
                  </div>
                  <span>All chats</span>
                </div>
              </div>
            </div>

            {/* Suggested Folders Section */}
            <div>
              <h3 className="text-sm font-semibold text-signal-text mb-4">Suggested folders</h3>
              <div className="space-y-5">
                {[
                  {
                    title: "Unread",
                    desc: "Unread messages from all chats",
                    icon: "💬",
                  },
                  {
                    title: "1:1 chats",
                    desc: "Only messages from direct chats",
                    icon: "👤",
                  },
                  {
                    title: "Groups",
                    desc: "Only messages from group chats",
                    icon: "👥",
                  },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-signal-sidebar-hover flex items-center justify-center text-lg">
                        {f.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-signal-text">{f.title}</p>
                        <p className="text-xs text-signal-text-muted">{f.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Added folder: ${f.title}`)}
                      className="bg-signal-sidebar-hover hover:bg-signal-sidebar-active text-signal-text text-xs font-semibold px-4 py-1.5 rounded-full transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "general":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Startup</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Launch Signal on system startup</span>
              </label>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">System Tray</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Minimize to system tray on window close</span>
              </label>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Theme</h3>
              <div className="space-y-2">
                {["System default", "Light", "Dark"].map((theme) => (
                  <label key={theme} className="flex items-center gap-3 text-xs text-signal-text cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      defaultChecked={theme === "Dark"}
                      className="border-signal-border text-signal-blue focus:ring-signal-blue"
                    />
                    <span>{theme}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "calls":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Calling Preferences</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" className="rounded border-signal-border bg-signal-input" />
                <span>Always relay calls through Signal servers to hide IP address</span>
              </label>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Messages</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Play sound for incoming messages</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Show desktop notifications</span>
              </label>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Messaging</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer mb-2">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Read receipts (Let others see when you read their messages)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Typing indicators (Let others see when you are typing)</span>
              </label>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Media Auto-Download</h3>
              <label className="flex items-center gap-2 text-xs text-signal-text-muted cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-signal-border bg-signal-input" />
                <span>Auto-download images and attachments on Wi-Fi</span>
              </label>
            </div>
          </div>
        );

      case "backups":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Local Backups</h3>
              <p className="text-xs text-signal-text-muted mb-3">
                Enable local backups to save copy of history to system folder.
              </p>
              <button
                onClick={() => alert("Backing up chats...")}
                className="bg-signal-blue hover:bg-signal-blue-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Create Backup Now
              </button>
            </div>
          </div>
        );

      case "donate":
        return (
          <div className="max-w-2xl w-full text-signal-text px-6 py-4 flex flex-col items-center text-center space-y-6">
            <span className="text-5xl">❤️</span>
            <div>
              <h3 className="text-lg font-bold">Donate to Signal</h3>
              <p className="text-xs text-signal-text-muted max-w-sm mt-2 leading-relaxed">
                Signal is a non-profit technology foundation. We don't track you. We don't show ads. Support free expression!
              </p>
            </div>
            <button
              onClick={() => alert("Thank you for your donation!")}
              className="bg-signal-blue hover:bg-signal-blue-dark text-white text-xs font-semibold px-6 py-2.5 rounded-full shadow-lg transition cursor-pointer"
            >
              Become a Sustainer
            </button>
          </div>
        );

      default:
        return null;
    }
  }

  const titleMap: Record<string, string> = {
    general: "General settings",
    appearance: "Appearance settings",
    chats: "Chat folders",
    calls: "Call preferences",
    notifications: "Notification settings",
    privacy: "Privacy settings",
    data: "Data usage settings",
    backups: "Local backups",
    donate: "Support Signal",
  };

  const title = titleMap[activeSettingsTab] || "Settings";

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1A1E] overflow-hidden">
      {/* Settings Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-signal-border bg-signal-header flex-shrink-0">
        <button
          onClick={() => setShowSettings(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-signal-text hover:bg-signal-sidebar-hover transition cursor-pointer"
          title="Back to chats"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-signal-text">{title}</h2>
      </div>

      {/* Settings Scrollable Content Pane */}
      <div className="flex-1 overflow-y-auto flex justify-center py-6">
        {renderContent()}
      </div>
    </div>
  );
}
