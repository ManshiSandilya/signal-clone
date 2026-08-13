"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getConversation, getMessages, getMe, getWsUrl } from "@/lib/api";
import { Conversation, Message, User } from "@/lib/types";
import MessageBubble from "@/components/MessageBubble";
import GroupInfoModal from "@/components/GroupInfoModal";
function conversationLabel(conv: Conversation, meId: string): string {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.participants.find((p) => p.user.id !== meId);
  return other?.user.display_name || "Unknown";
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [me, setMe] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    const ws = new WebSocket(getWsUrl(conversationId));
    wsRef.current = ws;

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
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: "mark_read" }));
    };

    return () => {
      cancelled = true;
      ws.close();
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

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: "send_message", body: trimmed }));
    setInput("");
    sendTyping(false);
  }

  if (!me || !conversation) {
    return <div className="flex-1 flex items-center justify-center text-signal-text-muted">Loading...</div>;
  }

  const label = conversationLabel(conversation, me.id);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-signal-border bg-signal-bg flex-shrink-0 ${
          conversation.type === "group" ? "cursor-pointer hover:bg-signal-sidebar" : ""
        }`}
        onClick={() => conversation.type === "group" && setShowGroupInfo(true)}
      >
        <div className="w-9 h-9 rounded-full bg-signal-blue/80 flex items-center justify-center text-white font-medium text-sm">
          {label.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-signal-text">{label}</p>
          <p className="text-xs text-signal-text-muted">
            {conversation.type === "group"
              ? `${conversation.participants.length} members`
              : (() => {
                  const other = conversation.participants.find((p) => p.user.id !== me.id);
                  if (!other) return "";
                  if (other.user.is_online) return "Online";
                  const mins = Math.floor((Date.now() - new Date(other.user.last_seen).getTime()) / 60000);
                  if (mins < 1) return "Last seen just now";
                  if (mins < 60) return `Last seen ${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `Last seen ${hrs}h ago`;
                  return `Last seen ${Math.floor(hrs / 24)}d ago`;
                })()}
          </p>
        </div>
      </div>

     <div className="flex-1 overflow-y-auto py-4">
        {messages.map((m, i) => {
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
            />
          );
        })}
        {typingUser && (
          <p className="text-xs text-signal-text-muted px-4 italic">{typingUser} is typing...</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-signal-border flex-shrink-0">
        <input
          type="file"
          id="attachment"
          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <label
          htmlFor="attachment"
          className="bg-signal-sidebar hover:bg-signal-sidebar-hover text-signal-text-muted rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer transition"
          title="Attach file"
        >
          📎
        </label>

        {attachmentFile && (
          <div className="flex items-center gap-2 bg-signal-sidebar rounded-lg px-3 py-2 text-xs text-signal-text">
            <span className="truncate">{attachmentFile.name}</span>
            <button
              type="button"
              onClick={() => setAttachmentFile(null)}
              className="text-signal-text-muted hover:text-signal-text"
            >
              ×
            </button>
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-signal-sidebar border border-signal-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal-blue"
        />
        <button
          type="submit"
          className="bg-signal-blue hover:bg-signal-blue-dark text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
        >
          ➤
        </button>
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