"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchContacts, createConversation } from "@/lib/api";
import { User } from "@/lib/types";

export default function NewChatModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await searchContacts(value.trim());
      setResults(data);
    } catch {
      setResults([]);
    }
  }

  function toggleSelect(user: User) {
    if (mode === "direct") {
      setSelected([user]);
      return;
    }
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  async function handleCreate() {
    if (selected.length === 0) {
      setError("Select at least one person.");
      return;
    }
    if (mode === "group" && !groupName.trim()) {
      setError("Group name is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const conv = await createConversation(
        mode,
        selected.map((u) => u.id),
        mode === "group" ? groupName.trim() : undefined
      );
      window.dispatchEvent(new CustomEvent("conversations:refresh"));
      onClose();
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      setError("Could not create conversation. It may already exist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-signal-text">New chat</h2>
          <button onClick={onClose} className="text-signal-text-muted hover:text-signal-text text-xl leading-none">
            ×
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setMode("direct");
              setSelected([]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === "direct" ? "bg-signal-blue text-white" : "bg-signal-sidebar text-signal-text-muted"
            }`}
          >
            Direct message
          </button>
          <button
            onClick={() => {
              setMode("group");
              setSelected([]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === "group" ? "bg-signal-blue text-white" : "bg-signal-sidebar text-signal-text-muted"
            }`}
          >
            Group
          </button>
        </div>

        {mode === "group" && (
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full border border-signal-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-signal-blue"
          />
        )}

        {/* Selected chips (group mode) */}
        {mode === "group" && selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 bg-signal-blue/10 text-signal-blue text-xs font-medium rounded-full pl-2.5 pr-1.5 py-1"
              >
                {u.display_name}
                <button onClick={() => toggleSelect(u)} className="text-signal-blue/70 hover:text-signal-blue">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full border border-signal-border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-signal-blue"
        />

        <div className="max-h-56 overflow-y-auto mb-3">
          {results.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id);
            return (
              <button
                key={user.id}
                onClick={() => toggleSelect(user)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-signal-sidebar transition ${
                  isSelected ? "bg-signal-blue/5" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-signal-blue/80 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-signal-text truncate">{user.display_name}</p>
                  <p className="text-xs text-signal-text-muted truncate">@{user.phone_or_username}</p>
                </div>
                {isSelected && <span className="text-signal-blue text-sm">✓</span>}
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60"
        >
          {loading ? "Creating..." : mode === "direct" ? "Start chat" : "Create group"}
        </button>
      </div>
    </div>
  );
}