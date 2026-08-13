"use client";

import { useState } from "react";
import { addMember, removeMember, searchContacts } from "@/lib/api";
import { Conversation, User } from "@/lib/types";

export default function GroupInfoModal({
  conversation,
  meId,
  onClose,
  onUpdated,
}: {
  conversation: Conversation;
  meId: string;
  onClose: () => void;
  onUpdated: (updated: Conversation) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const myRole = conversation.participants.find((p) => p.user.id === meId)?.role;
  const isAdmin = myRole === "admin";
  const memberIds = new Set(conversation.participants.map((p) => p.user.id));

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await searchContacts(value.trim());
      setResults(data.filter((u: User) => !memberIds.has(u.id)));
    } catch {
      setResults([]);
    }
  }

  async function handleAdd(user: User) {
    setBusy(true);
    setError("");
    try {
      const updatedParticipants = await addMember(conversation.id, user.id);
      onUpdated({ ...conversation, participants: updatedParticipants });
      setQuery("");
      setResults([]);
    } catch {
      setError("Could not add member.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(user: User) {
    setBusy(true);
    setError("");
    try {
      const updatedParticipants = await removeMember(conversation.id, user.id);
      onUpdated({ ...conversation, participants: updatedParticipants });
    } catch {
      setError("Could not remove member.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-lg p-5 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-signal-text">{conversation.name || "Group"}</h2>
          <button onClick={onClose} className="text-signal-text-muted hover:text-signal-text text-xl leading-none">
            ×
          </button>
        </div>

        <p className="text-xs text-signal-text-muted mb-2">
          {conversation.participants.length} members
        </p>

        <div className="overflow-y-auto flex-1 mb-3">
          {conversation.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-1 py-2">
              <div className="w-9 h-9 rounded-full bg-signal-blue/80 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {p.user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-signal-text truncate">
                  {p.user.display_name} {p.user.id === meId && "(You)"}
                </p>
                <p className="text-xs text-signal-text-muted">{p.role === "admin" ? "Admin" : "Member"}</p>
              </div>
              {isAdmin && p.user.id !== meId && (
                <button
                  onClick={() => handleRemove(p.user)}
                  disabled={busy}
                  className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="border-t border-signal-border pt-3">
            <input
              type="text"
              placeholder="Add member by username..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-signal-border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-signal-blue"
            />
            <div className="max-h-32 overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAdd(user)}
                  disabled={busy}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left hover:bg-signal-sidebar transition disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-signal-blue/80 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-signal-text">{user.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}