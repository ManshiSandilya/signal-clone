const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
import { Conversation, User } from "./types";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  
  // Conditionally set Content-Type so boundary header is automatically added for FormData
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(errBody));
  }
  
  // Some requests (like DELETE 204) do not return JSON body
  if (res.status === 204) return null;
  return res.json();
}

export async function login(phone_or_username: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone_or_username, password }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function register(
  phone_or_username: string,
  password: string,
  display_name: string,
  otp: string
) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ phone_or_username, password, display_name, otp }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function getMe(): Promise<User> {
  return apiFetch("/auth/me");
}

export async function updateProfile(displayName: string, avatarUrl: string | null): Promise<User> {
  return apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
  });
}

export async function getConversations(): Promise<Conversation[]> {
  return apiFetch("/conversations");
}

export async function getContacts() {
  return apiFetch("/contacts");
}

export async function getConversation(id: string): Promise<Conversation> {
  return apiFetch(`/conversations/${id}`);
}

export async function updateConversation(id: string, name?: string, avatarUrl?: string | null): Promise<Conversation> {
  return apiFetch(`/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...(name ? { name } : {}), ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}) }),
  });
}

export async function getMessages(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/messages`);
}

export function getWsUrl(conversationId: string): string {
  const token = getToken();
  const base = (process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000").replace(/\/$/, "");
  return `${base}/ws/chat/${conversationId}/?token=${token}`;
}

export async function sendMessageRest(conversationId: string, body: string) {
  return apiFetch(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteMessage(messageId: string) {
  return apiFetch(`/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function searchContacts(query: string) {
  return apiFetch(`/contacts/search?q=${encodeURIComponent(query)}`);
}

export async function addContact(phoneOrUsername: string, nickname?: string) {
  return apiFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({ phone_or_username: phoneOrUsername, nickname: nickname || "" }),
  });
}

export async function createConversation(
  type: "direct" | "group",
  participantIds: string[],
  name?: string
) {
  return apiFetch("/conversations", {
    method: "POST",
    body: JSON.stringify({ type, participant_ids: participantIds, ...(name ? { name } : {}) }),
  });
}

export async function leaveConversation(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/leave`, {
    method: "DELETE",
  });
}

export async function addMember(conversationId: string, userId: string) {
  return apiFetch(`/conversations/${conversationId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeMember(conversationId: string, userId: string) {
  return apiFetch(`/conversations/${conversationId}/members`, {
    method: "DELETE",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function setDisappearing(conversationId: string, seconds: number) {
  return apiFetch(`/conversations/${conversationId}/disappearing`, {
    method: "POST",
    body: JSON.stringify({ disappearing_seconds: seconds }),
  });
}

export async function uploadAttachment(messageId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch(`/messages/${messageId}/attachment`, {
    method: "POST",
    body: formData,
  });
}