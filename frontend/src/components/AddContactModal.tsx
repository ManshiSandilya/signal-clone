"use client";

import { useState } from "react";
import { addContact } from "@/lib/api";

export default function AddContactModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [phoneOrUsername, setPhoneOrUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const contact = await addContact(phoneOrUsername.trim(), nickname.trim());
      setSuccess(`Contact "${contact.user.display_name}" added!`);
      setPhoneOrUsername("");
      setNickname("");
      onSuccess();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      try {
        const errData = JSON.parse(err.message);
        setError(errData.detail || "Failed to add contact");
      } catch {
        setError("Failed to add contact");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-signal-modal-overlay flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-signal-modal border border-signal-border rounded-2xl w-full max-w-md shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-signal-text">Add contact</h2>
          <button onClick={onClose} className="text-signal-text-muted hover:text-signal-text text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-signal-text-muted mb-1 block">Phone or username</label>
            <input
              type="text"
              placeholder="e.g., +1234567890 or john_doe"
              value={phoneOrUsername}
              onChange={(e) => setPhoneOrUsername(e.target.value)}
              className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-signal-text-muted mb-1 block">Nickname (optional)</label>
            <input
              type="text"
              placeholder="Give them a friendly name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-signal-input text-signal-text border border-signal-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue focus:border-signal-blue"
              disabled={loading}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? "Adding..." : "Add contact"}
          </button>
        </form>
      </div>
    </div>
  );
}
