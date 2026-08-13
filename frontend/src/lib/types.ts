export interface User {
  id: string;
  phone_or_username: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

export interface MessageStatus {
  user: string;
  status: "sent" | "delivered" | "read";
  updated_at: string;
}

export interface Reaction {
  id: string;
  user: User;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: User;
  body: string;
  reply_to: string | null;
  created_at: string;
  is_deleted: boolean;
  statuses: MessageStatus[];
  attachment: string | null;
  reactions: Reaction[];
}

export interface Participant {
  id: string;
  user: User;
  role: "admin" | "member";
  joined_at: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar_url: string | null;
  last_message: Message | null;
  last_activity_at: string;
  unread_count: number;
  participants: Participant[];
  disappearing_seconds: number;
}