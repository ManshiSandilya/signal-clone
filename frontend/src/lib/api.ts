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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(errBody));
  }
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

export async function register(phone_or_username: string, password: string, display_name: string) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ phone_or_username, password, display_name }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data.user;
}


export async function getMe(): Promise<User> {
  return apiFetch("/auth/me");
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

export async function getMessages(conversationId: string) {
  return apiFetch(`/conversations/${conversationId}/messages`);
}