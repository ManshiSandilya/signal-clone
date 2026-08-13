"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getConversation,
  getMessages,
  getMe,
  getWsUrl,
  sendMessageRest,
  setDisappearing,
  leaveConversation,
  uploadAttachment,
} from "@/lib/api";
import { Conversation, Message, User } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import GroupInfoModal from "@/components/GroupInfoModal";
import SettingsPanel from "@/components/SettingsPanel";
import { useChat } from "@/lib/ChatContext";

function conversationLabel(conv: Conversation, meId: string): string {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.participants.find((p) => p.user.id !== meId);
  return other?.user.display_name || "Note to Self";
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const { showSettings } = useChat();

  const [me, setMe] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgsData = await getMessages(conversationId);
      setMessages(msgsData);
    } catch (e) {
      console.error(e);
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [meData, convData, msgsData] = await Promise.all([
        getMe(),
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
      if (cancelled) return;
      setMe(meData);
      setConversation(convData);
      setMessages(msgsData);
    }
    load().catch(console.error);

    function connectWebSocket() {
      if (cancelled) return;
      
      const ws = new WebSocket(getWsUrl(conversationId));
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setWsError(null);
        reconnectAttemptsRef.current = 0;
        ws.send(JSON.stringify({ action: "mark_read" }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.data.id);
            if (exists) return prev.map((m) => (m.id === data.data.id ? data.data : m));
            return [...prev, data.data];
          });
          setTypingUser(null);
          window.dispatchEvent(new CustomEvent("conversations:refresh"));
        } else if (data.type === "typing") {
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          if (data.is_typing) {
            setTypingUser(data.display_name);
            typingClearRef.current = setTimeout(() => setTypingUser(null), 3000);
          } else {
            setTypingUser(null);
          }
        } else if (data.type === "read_receipt" || data.type === "delivery_receipt") {
          getMessages(conversationId).then(setMessages).catch(console.error);
        } else if (data.type === "settings_update") {
          getConversation(conversationId).then(setConversation).catch(console.error);
        }
      };

      ws.onerror = () => {
        setWsError("Connection error");
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (cancelled) return;
        
        const delayMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;
        
        setWsError(`Disconnected. Reconnecting in ${Math.round(delayMs / 1000)}s...`);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delayMs);
      };
    }

    connectWebSocket();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [conversationId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ action: "typing", is_typing: isTyping }));
  }, []);

  function handleReaction(messageId: string, emoji: string) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "react", message_id: messageId, emoji }));
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
    sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && !attachmentFile) return;

    try {
      if (attachmentFile) {
        setUploading(true);
        const msg = await sendMessageRest(conversationId, trimmed || `Sent a file: ${attachmentFile.name}`);
        await uploadAttachment(msg.id, attachmentFile);
        setAttachmentFile(null);
      } else {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: "send_message", body: trimmed }));
        } else {
          await sendMessageRest(conversationId, trimmed);
        }
      }
      setInput("");
      sendTyping(false);
      loadMessages();
      window.dispatchEvent(new CustomEvent("conversations:refresh"));
    } catch (err: any) {
      try {
        const errData = JSON.parse(err.message);
        alert(errData.detail || "Failed to send message");
      } catch {
        alert("Failed to send message");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSetDisappearingTimer(seconds: number) {
    try {
      const updated = await setDisappearing(conversationId, seconds);
      setConversation(updated);
      setShowSettingsMenu(false);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "mark_read" }));
      }
    } catch {
      alert("Failed to update disappearing settings");
    }
  }

  async function handleLeaveChat() {
    const text = conversation?.type === "group" ? "leave this group" : "delete this conversation";
    if (!confirm(`Are you sure you want to ${text}?`)) return;

    try {
      await leaveConversation(conversationId);
      window.dispatchEvent(new CustomEvent("conversations:refresh"));
      router.push("/chat");
    } catch {
      alert("Failed to leave or delete conversation");
    }
  }

  if (showSettings) {
    return <SettingsPanel />;
  }

  if (!me || !conversation) {
    return <div className="flex-1 flex items-center justify-center text-signal-text-muted">Loading...</div>;
  }

  // Determine if it is a Note to Self conversation
  const isNoteToSelf =
    conversation.type === "direct" &&
    (conversation.participants.length === 1 ||
      !conversation.participants.some((p) => p.user.id !== me.id));

  const label = isNoteToSelf ? "Note to Self" : conversationLabel(conversation, me.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-signal-bg relative">
      {/* ── Chat Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-signal-header flex-shrink-0 relative shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            onClick={() => router.push("/chat")}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text mr-1 transition cursor-pointer"
            title="Back to chats"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Avatar */}
          {isNoteToSelf ? (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border border-signal-border flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-signal-blue/80 flex items-center justify-center text-white font-medium text-base flex-shrink-0">
              {label.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-signal-text truncate">{label}</p>
              {isNoteToSelf && (
                <span className="text-signal-blue flex-shrink-0" title="Official Chat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-signal-text-muted truncate">
              {isNoteToSelf ? (
                "Official chat"
              ) : !wsConnected && wsError ? (
                <span className="text-yellow-600 font-medium">{wsError}</span>
              ) : conversation.type === "group" ? (
                `${conversation.participants.length} members`
              ) : (
                (() => {
                  const other = conversation.participants.find((p) => p.user.id !== me.id);
                  if (!other) return "";
                  if (other.user.is_online) return "Online";
                  const mins = Math.floor((Date.now() - new Date(other.user.last_seen).getTime()) / 60000);
                  if (mins < 1) return "Last seen just now";
                  if (mins < 60) return `Last seen ${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `Last seen ${hrs}h ago`;
                  return `Last seen ${Math.floor(hrs / 24)}d ago`;
                })()
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 relative">
          {/* Video Call Button */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition cursor-pointer"
            title="Video call"
            onClick={() => alert("Video calling coming soon!")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          
          {/* Phone Call Button */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition cursor-pointer"
            title="Voice call"
            onClick={() => alert("Voice calling coming soon!")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>

          {/* Search Button */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition cursor-pointer"
            title="Search conversation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Three dots menu */}
          <button
            onClick={() => setShowSettingsMenu((v) => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-signal-text-muted hover:bg-signal-sidebar-hover hover:text-signal-text transition cursor-pointer"
            title="Conversation settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>

          {showSettingsMenu && (
            <div
              className="absolute top-10 right-0 bg-signal-panel border border-signal-border rounded-lg shadow-2xl py-1.5 w-56 z-20 text-sm"
              onMouseLeave={() => setShowSettingsMenu(false)}
            >
              {conversation.type === "group" && (
                <button
                  onClick={() => {
                    setShowGroupInfo(true);
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-signal-text hover:bg-signal-sidebar-hover transition"
                >
                  View group members
                </button>
              )}

              {/* Disappearing Timer Selector */}
              <div className="px-3 py-1.5 border-b border-signal-border">
                <p className="text-xs text-signal-text-muted mb-1">Disappearing messages</p>
                <select
                  value={conversation.disappearing_seconds}
                  onChange={(e) => handleSetDisappearingTimer(Number(e.target.value))}
                  className="w-full bg-signal-input text-signal-text border border-signal-border rounded px-2 py-1 text-xs focus:outline-none"
                >
                  <option value={0}>Off</option>
                  <option value={30}>30 seconds</option>
                  <option value={300}>5 minutes</option>
                  <option value={3600}>1 hour</option>
                  <option value={86400}>1 day</option>
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleLeaveChat}
                className="w-full text-left px-3 py-2 text-red-500 hover:bg-signal-sidebar-hover transition font-medium mt-1"
              >
                {conversation.type === "group" ? "Leave group" : "Delete conversation"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages Stream ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Special Note to Self introduction card */}
        {isNoteToSelf && (
          <div className="flex justify-center mb-6 px-4">
            <div className="w-full max-w-[420px] bg-[#2A2A2E]/25 border border-signal-border rounded-[24px] p-6 flex flex-col items-center text-center shadow-lg">
              {/* Notepad Avatar inside Circle */}
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-lg font-semibold text-signal-text">Note to Self</h3>
                <span className="text-signal-blue" title="Official Chat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </span>
              </div>

              {/* Blue Official Chat badge */}
              <span className="inline-flex items-center gap-1 bg-signal-blue text-white text-[11px] font-semibold rounded-full px-3 py-1.5 mb-4 shadow-sm">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Official chat
              </span>

              <p className="text-xs text-signal-text-muted leading-relaxed max-w-[340px]">
                You can add notes for yourself in this chat. If your account has any linked devices, new notes will be synced.
              </p>
            </div>
          </div>
        )}

        {/* Date separator "Today" */}
        <div className="flex items-center justify-center my-6 px-4">
          <span className="text-xs font-semibold text-signal-text-muted select-none">
            Today
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-xs text-signal-text-dim">Empty notebook. Type below to write a note.</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isFirstInGroup = !prev || prev.sender.id !== m.sender.id;
            const isLastInGroup = !next || next.sender.id !== m.sender.id;
            return (
              <MessageBubble
                key={m.id}
                message={m}
                meId={me.id}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                onReact={(emoji) => handleReaction(m.id, emoji)}
                onDeleted={loadMessages}
              />
            );
          })
        )}
        {typingUser && (
          <p className="text-xs text-signal-text-muted px-4 py-1 italic animate-pulse">
            ✍️ {typingUser} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Message Form Input ─────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 bg-transparent flex-shrink-0 mb-2">
        <input
          type="file"
          id="attachment"
          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
          className="hidden"
          disabled={uploading}
        />

        {/* Smiley Emoji Trigger Button */}
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-signal-text-muted hover:text-signal-text hover:bg-signal-sidebar-hover transition flex-shrink-0 cursor-pointer text-xl"
          title="Stickers / Emojis"
        >
          😊
        </button>

        {attachmentFile && (
          <div className="flex items-center gap-2 bg-signal-input border border-signal-border rounded-lg px-3 py-2 text-xs text-signal-text max-w-xs">
            <span className="truncate">{attachmentFile.name}</span>
            <button
              type="button"
              onClick={() => setAttachmentFile(null)}
              className="text-signal-text-muted hover:text-signal-text font-bold"
            >
              ×
            </button>
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={uploading ? "Uploading attachment..." : "Message"}
          className="flex-1 bg-signal-input text-signal-text rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-signal-blue"
          disabled={uploading}
        />

        {/* Microphone or Send button depending on input presence */}
        {input.trim() || attachmentFile ? (
          <button
            type="submit"
            disabled={uploading}
            className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 transition cursor-pointer"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "➤"
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Microphone Icon Button */}
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-signal-text hover:bg-signal-sidebar-hover transition cursor-pointer bg-signal-input"
              title="Voice message (Placeholder)"
              onClick={() => alert("Voice messages coming soon!")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>

            {/* Plus Attachment Button */}
            <label
              htmlFor="attachment"
              className="w-10 h-10 rounded-full flex items-center justify-center text-signal-text hover:bg-signal-sidebar-hover transition cursor-pointer bg-signal-input flex-shrink-0"
              title="Attach file"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </label>
          </div>
        )}

      </form>

      {showGroupInfo && (
        <GroupInfoModal
          conversation={conversation}
          meId={me.id}
          onClose={() => setShowGroupInfo(false)}
          onUpdated={(updated) => setConversation(updated)}
        />
      )}
    </div>
  );
}