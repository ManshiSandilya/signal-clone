# Signal Clone — Secure Messaging Platform

A full-stack, real-time messaging application that faithfully replicates Signal Messenger's design, user experience, and core workflows. Built as a single-page application with a split-pane layout (conversation list + chat pane), real-time WebSocket messaging, and a privacy-focused interface.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-Django_6.1-092E20?logo=django)
![Tech Stack](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)
![Tech Stack](https://img.shields.io/badge/Realtime-WebSockets-010101?logo=websocket)
![Tech Stack](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)

**🔴 Live Demo:** [https://signal-clone-theta.vercel.app](https://signal-clone-theta.vercel.app)

---

## Table of Contents

- [User Guide](#user-guide)
  - [Registration & Login](#registration--login)
  - [App Layout & Navigation](#app-layout--navigation)
  - [Icon Reference](#icon-reference)
  - [Chats Tab](#chats-tab)
  - [Starting a New Chat](#starting-a-new-chat)
  - [Sending Messages](#sending-messages)
  - [Message Actions](#message-actions)
  - [Emoji Reactions](#emoji-reactions)
  - [File Attachments](#file-attachments)
  - [Delivery Receipts & Read Status](#delivery-receipts--read-status)
  - [Typing Indicators](#typing-indicators)
  - [Group Chats](#group-chats)
  - [Note to Self](#note-to-self)
  - [Disappearing Messages](#disappearing-messages)
  - [Adding Contacts](#adding-contacts)
  - [Searching Conversations](#searching-conversations)
  - [Calls Tab](#calls-tab)
  - [Stories Tab](#stories-tab)
  - [Settings](#settings)
  - [Logging Out](#logging-out)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Seed Data](#seed-data)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Assumptions & Design Decisions](#assumptions--design-decisions)

---

## User Guide

### Registration & Login

#### Creating a New Account (3-step registration)

1. **Navigate** to `/register` (or click "Register" on the login page).

2. **Step 1 — Enter Credentials**
   - Type your **phone number or username** (this will be your unique identifier).
   - Type a **password** (min 1 character for demo; use something memorable).
   - Click **"Send OTP"** button.

3. **Step 2 — Verify OTP**
   - The demo OTP is always **`123456`** (displayed as a hint on screen).
   - Type `123456` in the OTP input field.
   - Click **"Verify OTP"**.

4. **Step 3 — Complete Profile**
   - Type your **display name** (this is what other users will see).
   - Click **"Create account"**.
   - ✅ You are automatically logged in and redirected to the **Chats** page.

#### Logging In (existing account)

1. Navigate to `/login`.
2. Enter your **username/phone** and **password**.
3. Click **"Sign in"**.
4. ✅ Redirected to the Chats page.

---

### App Layout & Navigation

The app uses a **three-column layout**:

```
┌──────────┬─────────────────────┬─────────────────────────────┐
│ Nav Bar  │    Sidebar Panel    │        Chat Pane            │
│ (52px)   │  (conversations,    │  (messages, input bar,      │
│          │   calls, stories,   │   header with actions)      │
│          │   settings menu)    │                             │
└──────────┴─────────────────────┴─────────────────────────────┘
```

**Left Navigation Bar** — A thin vertical strip on the far left with icon buttons:

| Position | Icon | Action |
|----------|------|--------|
| Top | ☰ (three horizontal lines) | Opens the **hamburger menu** with profile info, add contact, and logout |
| 2nd | 💬 (chat bubble) | Switch to **Chats** tab |
| 3rd | 📞 (phone) | Switch to **Calls** tab |
| 4th | 📱 (stories icon) | Switch to **Stories** tab |
| Bottom | ⚙️ (gear) | Toggle **Settings** panel |

The currently active tab is highlighted with a filled icon and a darker background.

---

### Icon Reference

Here is a complete reference of every icon used throughout the app and what it does:

#### Navigation Bar Icons (Left Strip)

| Icon | Visual | Location | What it does |
|------|--------|----------|-------------|
| **Hamburger Menu** | ☰ Three horizontal lines | Top of nav bar | Opens dropdown menu (profile, add contact, logout) |
| **Chats** | 💬 Chat bubble | Nav bar | Shows conversation list |
| **Calls** | 📞 Phone | Nav bar | Shows calls tab (placeholder) |
| **Stories** | 📱 Rounded rectangle | Nav bar | Shows stories tab (placeholder) |
| **Settings** | ⚙️ Gear | Bottom of nav bar | Opens settings panel |

#### Chat Header Icons (Top of chat pane)

| Icon | Visual | Location | What it does |
|------|--------|----------|-------------|
| **Back Arrow** | ◀ Chevron left | Left side (mobile only) | Returns to conversation list |
| **Video Call** | 🎥 Camera with play button | Right side of header | Placeholder — shows "Video calling coming soon!" |
| **Voice Call** | 📞 Phone | Right side of header | Placeholder — shows "Voice calling coming soon!" |
| **Search** | 🔍 Magnifying glass | Right side of header | Search within conversation (placeholder) |
| **More Options** | ••• Three dots (horizontal) | Right side of header | Opens conversation settings dropdown |

#### Sidebar Header Icons (Chats tab)

| Icon | Visual | Location | What it does |
|------|--------|----------|-------------|
| **New Chat** | ✏️ Pencil on notepad | Top-right of "Chats" header | Opens "New Chat" modal to create direct or group chats |
| **Three Dots** | ••• Three filled dots | Next to compose icon | Opens "Add Contact" modal |
| **Search** | 🔍 Magnifying glass | In search bar | Filter conversations by name |
| **Filter** | ≡ Three horizontal lines (decreasing) | Right of search bar | Filter chats (coming soon) |

#### Message Bubble Icons

| Icon | Visual | Meaning |
|------|--------|---------|
| **Single Tick** | ✓ | Message sent to server |
| **Double Tick (grey)** | ✓✓ | Message delivered to recipient |
| **Double Tick (blue)** | ✓✓ (blue) | Message read by recipient |
| **Smiley Face** | 😀 | Opens emoji reaction picker on hover |
| **Trash Can** | 🗑️ | Delete your own message |

#### Calls Tab Icons

| Icon | Visual | What it does |
|------|--------|-------------|
| **New Call** | 📞+ Phone with plus | Start a new call (placeholder) |
| **Three Dots** | ••• | More options (placeholder) |
| **Link** | 🔗 Chain link icon | Create a Call Link (placeholder) |

#### Stories Tab Icons

| Icon | Visual | What it does |
|------|--------|-------------|
| **Plus** | ✚ | Add a new story (placeholder) |
| **Three Dots** | ••• | More options (placeholder) |
| **Plus Badge** | Small blue + on avatar | Indicates "Add a story" on My Story |
| **Checkmark Badge** | ✓ Blue circle | Verified/Official account (Signal) |

#### Conversation List Icons

| Icon | Visual | Meaning |
|------|--------|---------|
| **Green Dot** | 🟢 Small green circle | User is currently online |
| **Blue Badge** | Numbered circle | Unread message count |
| **Notepad Icon** | 📝 Lines on rectangle | "Note to Self" conversation |
| **Group Avatar** | 👥 Two-person silhouette | Group conversation |

---

### Chats Tab

The **Chats** tab is the default view when you open the app.

**What you see:**
- **Header** with "Chats" title, compose (✏️) button, and three-dots (•••) button
- **Search bar** to filter conversations by name
- **Conversation list** showing all your active chats, sorted by most recent activity

**Each conversation row shows:**
- **Avatar** — First letter of the contact's name (or group icon)
- **Name** — Display name or group name
- **Last message preview** — Truncated text of the most recent message
- **Timestamp** — When the last message was sent (e.g., "2m", "1h", "3d")
- **Unread badge** — Blue circle with count (if unread messages exist)
- **Online indicator** — Green dot on avatar if the user is currently online

**Click any conversation** to open it in the right chat pane.

---

### Starting a New Chat

1. Click the **compose icon** (✏️ pencil) in the Chats header.
2. The **"New chat"** modal opens with two modes:
   - **Direct message** — For 1-on-1 conversations
   - **Group** — For group conversations

#### Creating a Direct Message

1. Select the **"Direct message"** tab (selected by default).
2. In the search field, type a username or display name (minimum 2 characters).
3. Search results appear below — click on a user to select them (they'll be highlighted).
4. Click **"Create"** button.
5. ✅ The conversation opens immediately. If a conversation with that user already exists, you'll be taken to the existing one.

#### Creating a Group Chat

1. Click the **"Group"** tab in the modal.
2. Enter a **Group name** in the text field.
3. Search for users and **click to select multiple members** (they appear as selected chips).
4. Click to deselect if you change your mind.
5. Click **"Create"** button.
6. ✅ A new group conversation is created with you as the admin.

#### Creating a "Note to Self"

1. In the New Chat modal, click the **"Note to Self"** button at the bottom (appears in both Direct and Group modes).
2. ✅ A personal chat is created where you can send messages only to yourself. Useful for bookmarks, reminders, and drafts.

---

### Sending Messages

1. Open any conversation by clicking on it in the sidebar.
2. Type your message in the **input field** at the bottom of the chat pane.
3. Press **Enter** or click the **Send button** (➤ arrow icon) to send.
4. Your message appears instantly on the right side (blue bubble) with a timestamp and delivery status tick.

**Emoji in messages:**
- Click the **😀 smiley face** icon to the left of the input field to open an emoji picker.
- Select an emoji to insert it into your message.
- The picker shows 10 quick-access emojis: 😀 😂 😍 😭 🥺 👍 ❤️ 🔥 ✨ 🎉

---

### Message Actions

**Hover over any message bubble** to reveal action buttons:

- **😀 Smiley icon** — Opens the emoji reaction picker (add a reaction to the message)
- **🗑️ Trash icon** — Delete the message (only visible on your own messages)

#### Deleting a Message

1. Hover over your own message.
2. Click the **trash can icon** (🗑️).
3. The message body is replaced with *"This message was deleted"* in italic.
4. The deletion is visible to all participants in real-time.

> **Note:** You can only delete your own messages. The message row is preserved for referential integrity.

---

### Emoji Reactions

React to any message with an emoji:

1. **Hover** over a message bubble.
2. Click the **smiley face** (😀) button that appears.
3. An emoji picker appears with options: 😀 😂 😍 😭 🥺 👍 ❤️ 🔥 ✨ 🎉
4. Click an emoji to react.
5. The reaction appears **below the message bubble** as a small badge.
6. Other participants see the reaction in real-time.

**To remove your reaction:**
- Click the same emoji reaction badge below the message — it will be removed.

---

### File Attachments

Send files along with messages:

1. Click the **paperclip icon** (📎) in the input bar.
2. Select a file from your device (max **25 MB**).
3. The file name appears as a preview in the input area.
4. Optionally type a message to accompany the file.
5. Click **Send** (➤).
6. The file is uploaded and attached to the message.

> **Supported files:** Any file type up to 25 MB. The backend validates the size server-side.

---

### Delivery Receipts & Read Status

Messages show delivery status with tick marks (just like Signal):

| Status | Visual | Meaning |
|--------|--------|---------|
| **Sent** | ✓ (single grey tick) | Message has been sent to the server |
| **Delivered** | ✓✓ (double grey ticks) | Message has been delivered to the recipient's device |
| **Read** | ✓✓ (double blue ticks) | Message has been opened and read by the recipient |

- Ticks appear in the **bottom-right corner** of your sent message bubbles.
- In group chats, the status reflects the aggregate of all recipients.

---

### Typing Indicators

When another user is typing in a conversation you're viewing:

- A **"✍️ Alice is typing..."** message appears below the last message.
- The text **pulses** with a subtle animation.
- The indicator disappears after 3 seconds of inactivity or when the user sends their message.

Your typing is also broadcast to other participants when you start typing in the input field.

---

### Group Chats

#### Viewing Group Info

1. Open a group conversation.
2. Click the **three dots** (•••) in the chat header.
3. Click **"View group members"** from the dropdown.
4. A modal shows all members with their roles (Admin / Member).

#### Managing Members (Admin only)

If you are the group admin:

- **Add members** — In the Group Info modal, search for users and click "Add".
- **Remove members** — Click the "Remove" button next to a member's name.
- **Update group name/avatar** — Available in the group info panel.

#### Leaving a Group

1. Click the **three dots** (•••) in the chat header.
2. Click **"Leave group"** (red text at the bottom of the dropdown).
3. Confirm the action in the dialog.
4. ✅ You are removed from the group and redirected to the chats list.

---

### Note to Self

A special personal chat for sending messages to yourself:

**How to create it:**
1. Click the compose (✏️) button → "New Chat" modal.
2. Click **"Note to Self"** button at the bottom.

**What it looks like:**
- Has a unique **notepad icon** (📝) instead of a regular avatar.
- Shows a **blue "Official chat" badge** (✓) next to the name.
- Displays a special introduction card explaining the feature.
- The header shows "Note to Self" with the verified badge.

**Use it for:** Personal reminders, bookmarks, draft messages, and quick notes.

---

### Disappearing Messages

Set a timer to auto-delete messages in any conversation:

1. Open a conversation.
2. Click the **three dots** (•••) in the chat header.
3. Under **"Disappearing messages"**, select a timer from the dropdown:
   - **Off** — Messages persist forever
   - **30 seconds**
   - **5 minutes**
   - **1 hour**
   - **1 day**
4. The setting applies to all future messages in the conversation.
5. Other participants are notified of the change in real-time.

> **Note:** Messages are filtered at query time, not deleted by a background job.

---

### Adding Contacts

There are **two ways** to add contacts:

#### Method 1: Hamburger Menu

1. Click the **☰ hamburger** icon (top of the left nav bar).
2. Click **"Add contact"** from the dropdown menu.
3. Enter the user's **phone number or username**.
4. Optionally add a **nickname**.
5. Click **"Add"**.

#### Method 2: Three Dots Button

1. In the Chats tab, click the **three dots** (•••) button next to the compose icon.
2. The "Add Contact" modal opens.
3. Follow the same steps as above.

After adding a contact, you can find them when creating new conversations.

---

### Searching Conversations

**In the Sidebar (Chats tab):**

1. Use the **search bar** at the top of the conversation list.
2. Type a name — conversations are filtered **in real-time** as you type.
3. Matches are found by display name or group name (case-insensitive).
4. Clear the search to see all conversations again.

**Searching for Users (when creating chats or adding contacts):**

1. Open the "New Chat" modal or "Add Contact" modal.
2. Type at least **2 characters** to trigger a search.
3. Results match against both **username** and **display name**.

---

### Calls Tab

Click the **📞 phone icon** in the left navigation bar.

**What you see:**
- **Header** with "Calls" title, "New call" (📞+) button, and "More" (•••) button
- **Search bar** to search calls
- **Filter button** (≡) to filter call types
- **"Create a Call Link"** button with a 🔗 link icon — creates a shareable call link
- **Empty state** message: "No calls — Recent calls will appear here."

> **Note:** Voice and video calling is a **placeholder feature**. The UI is fully built but actual WebRTC calling is not yet implemented.

---

### Stories Tab

Click the **stories icon** (📱 rounded rectangle) in the left navigation bar.

**What you see:**
- **Header** with "Stories" title, "Add story" (✚) button, and "More" (•••) button
- **Search bar** to search stories
- **"My Story"** — Your personal story row with:
  - Your avatar with a **blue + badge** in the corner
  - "Add a story" subtitle
- **"Signal"** — The official Signal story with:
  - Signal's blue avatar with a **verified checkmark** (✓)
  - A small thumbnail preview

> **Note:** Stories is a **placeholder feature**. The UI is fully built but story posting and viewing is not yet implemented.

---

### Settings

Click the **⚙️ gear icon** at the bottom of the left navigation bar.

**The sidebar switches to a settings menu** with your profile header and the following categories:

| Category | Icon | What it contains |
|----------|------|-----------------|
| **General** | ⚙️ | Startup options, system tray, spell check, device name |
| **Appearance** | 🎨 | Theme selection, language, zoom level |
| **Chats** | 💬 | Chat folders (create, manage, suggested folders like Unread/1:1/Groups) |
| **Calls** | 📞 | Call relay settings |
| **Notifications** | 🔔 | Notification preferences, sound, badges |
| **Privacy** | 🔒 | Read receipts, typing indicators, disappearing messages default |
| **Data usage** | 🌐 | Media auto-download, storage management |
| **Backups** | ⏰ | Backup and restore settings |
| **Donate to Signal** | ❤️ | Donation options |

Click any category to view its settings in the main panel. Click the **⚙️ gear** icon again (or any tab icon) to exit settings.

---

### Logging Out

1. Click the **☰ hamburger** icon at the top of the left navigation bar.
2. In the dropdown menu, you'll see:
   - Your display name and account info
   - "Add contact" option
   - "Preferences" (disabled)
   - "Keyboard shortcuts" (disabled)
3. Click **"Logout"** (red text at the bottom).
4. ✅ You are logged out and redirected to the login page.

---

## Features

### Core (Fully Implemented)

| Feature | Description |
|---------|-------------|
| **Authentication** | Register with phone/username + mocked OTP → set display name → JWT login/logout with session persistence |
| **Conversation List** | Signal-style left sidebar with unread badges, last-message preview, online indicators, and search |
| **1-on-1 Messaging** | Real-time direct messaging via WebSockets with message persistence |
| **Group Messaging** | Create named groups, send/receive group messages, admin controls for add/remove members |
| **Delivery Receipts** | Single ✓ (sent) → double ✓ (delivered) → blue ✓✓ (read) — just like Signal |
| **Typing Indicators** | Real-time "Alice is typing..." shown to other participants |
| **Message Timestamps** | Inline timestamps on every message bubble |
| **Online / Last Seen** | Green dot + "Last seen 5m ago" on conversation headers |
| **Search** | Filter conversations by name in the sidebar |
| **Contact Management** | Add contacts by username, view contact list |
| **Profile Update** | Edit display name and avatar URL via PATCH /api/auth/me |
| **Group Settings** | Admin can update group name and avatar |
| **Message Deletion** | Soft-delete messages (sender only), body is cleared, "deleted" flag propagated via WS |
| **Leave / Delete Chat** | Leave a group or delete a direct conversation |
| **File Attachments** | Upload files to messages (25 MB limit with server-side validation) |
| **Emoji Reactions** | React to messages with emoji, remove reactions (POST/DELETE) |
| **Disappearing Messages** | Configurable auto-delete timer per conversation |
| **Note to Self** | Personal chat — send messages to yourself, searchable by name or "note to self" |
| **Calls Tab UI** | Full Calls sidebar with search, filter, Create a Call Link button, and empty state |
| **Stories Tab UI** | Full Stories sidebar with My Story, Signal official story, and story viewer empty state |
| **Video/Voice Call Icons** | Video camera and phone icons in chat header (placeholder actions) |
| **Dark Theme** | Signal's authentic dark mode with shadow-based section separation |

### Placeholder Sections

| Feature | Status |
|---------|--------|
| Voice / Video Calls | UI implemented (sidebar + icons); actual WebRTC calling not wired |
| Stories | UI implemented (sidebar with My Story + Signal story); posting/viewing not wired |
| Linked Devices | Placeholder |
| End-to-End Encryption | Simulated — messages are transmitted over WS and stored in SQLite; no real E2E crypto |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16 (App Router, TypeScript) | Server components, file-based routing, excellent DX |
| **Styling** | Tailwind CSS 4 | Rapid UI development with Signal's design tokens |
| **Backend** | Django 6.1 + Django REST Framework | Mature ORM, admin panel, proven at scale |
| **Real-time** | Django Channels (WebSockets) | Native Django integration, async consumer pattern |
| **Auth** | JWT via `djangorestframework-simplejwt` | Stateless, frontend-friendly token auth |
| **ASGI Server** | Daphne | Required for Channels WebSocket support |
| **Database** | SQLite | Zero-config, file-based — perfect for this scope |
| **Channel Layer** | In-Memory | Suitable for single-process dev; swap to Redis for production |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌──────────────┐   ┌──────────────────────────────────────┐ │
│  │   Sidebar     │   │           Chat Pane                  │ │
│  │  (REST API)   │   │  REST (send/fetch) + WebSocket (live)│ │
│  └──────┬───────┘   └──────────┬───────────────────────────┘ │
└─────────┼──────────────────────┼─────────────────────────────┘
          │ HTTP                 │ HTTP + WS
          ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Daphne (ASGI Server)                     │
│  ┌─────────────────────┐   ┌──────────────────────────────┐ │
│  │   DRF Views (REST)   │   │  Channels Consumer (WebSocket)│ │
│  │  /api/conversations  │   │  /ws/chat/<id>/               │ │
│  │  /api/messages       │   │  Actions: send, typing, react │ │
│  │  /api/auth/*         │   │  Events: message, receipt,    │ │
│  │  /api/contacts       │   │          typing indicator     │ │
│  └──────────┬──────────┘   └──────────┬───────────────────┘ │
│             │                         │                      │
│             ▼                         ▼                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Django ORM + SQLite Database              │   │
│  │   Users │ Contacts │ Conversations │ Messages │ ...   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Authentication**: Client sends credentials → backend returns JWT access + refresh tokens → stored in `localStorage`.
2. **Fetching data**: Sidebar loads conversations via `GET /api/conversations`; clicking a chat fetches messages via REST.
3. **Real-time messaging**: Opening a chat also establishes a WebSocket to `/ws/chat/<id>/`. Messages sent via WS are broadcast to all participants and persisted.
4. **Hybrid approach**: REST endpoints handle CRUD; WebSocket handles real-time broadcasting. REST actions (e.g., adding a reaction via POST) also broadcast via WS using `async_to_sync`.

---

## Database Schema

```
┌─────────────────────┐       ┌─────────────────────────────┐
│       User          │       │         Contact              │
├─────────────────────┤       ├─────────────────────────────┤
│ id (UUID, PK)       │       │ id (UUID, PK)               │
│ phone_or_username   │◄──────│ owner_id (FK → User)        │
│ display_name        │       │ contact_user_id (FK → User) │
│ avatar_url          │       │ nickname                    │
│ is_online           │       │ added_at                    │
│ last_seen           │       └─────────────────────────────┘
│ password (hashed)   │
│ created_at          │
└────────┬────────────┘
         │
         │  participates in
         ▼
┌─────────────────────────────┐     ┌──────────────────────────┐
│  ConversationParticipant    │     │      Conversation         │
├─────────────────────────────┤     ├──────────────────────────┤
│ id (UUID, PK)               │     │ id (UUID, PK)            │
│ conversation_id (FK) ───────┼────►│ type (direct | group)    │
│ user_id (FK → User)         │     │ name                     │
│ role (admin | member)       │     │ avatar_url               │
│ joined_at                   │     │ created_by (FK → User)   │
│ last_read_at                │     │ last_message (FK → Msg)  │
└─────────────────────────────┘     │ last_activity_at         │
                                    │ disappearing_seconds     │
                                    │ created_at               │
                                    └──────────┬───────────────┘
                                               │
                                               │ has many
                                               ▼
┌──────────────────────────┐     ┌───────────────────────────┐
│        Message            │     │      MessageStatus         │
├──────────────────────────┤     ├───────────────────────────┤
│ id (UUID, PK)            │     │ id (UUID, PK)             │
│ conversation_id (FK)     │     │ message_id (FK → Message) │
│ sender_id (FK → User)    │     │ user_id (FK → User)       │
│ body (text)              │     │ status (sent|delivered|    │
│ reply_to (FK → self)     │     │         read)             │
│ created_at               │     │ updated_at                │
│ is_deleted               │     └───────────────────────────┘
└──────┬───────────────────┘
       │
       │ has one                  has many
       ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│    Attachment         │   │      Reaction         │
├──────────────────────┤   ├──────────────────────┤
│ id (UUID, PK)        │   │ id (UUID, PK)        │
│ message_id (FK)      │   │ message_id (FK)      │
│ file (FileField)     │   │ user_id (FK → User)  │
│ file_name            │   │ emoji (max 8 chars)  │
│ file_type            │   │ created_at           │
│ file_size            │   └──────────────────────┘
│ uploaded_at          │
└──────────────────────┘
```

### Key Design Decisions

- **UUIDs as primary keys** — prevents enumeration attacks and is frontend-friendly.
- **`is_deleted` soft-delete** — preserves message history for admin/compliance while hiding from UI.
- **`last_read_at` on participant** — enables efficient unread count: `messages WHERE created_at > last_read_at`.
- **Per-recipient `MessageStatus`** — supports per-user sent/delivered/read tracking (Signal's double-tick system).
- **`unique_together` constraints** — prevent duplicate participants, duplicate reactions per user, and duplicate contacts.
- **`last_message` + `last_activity_at` on Conversation** — denormalized for O(1) sidebar rendering without joins.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-otp` | Request OTP (mocked, always `123456`) |
| `POST` | `/api/auth/register` | Register with phone/username + OTP + password + display_name |
| `POST` | `/api/auth/login` | Login, returns JWT access + refresh tokens |
| `GET` | `/api/auth/me` | Get authenticated user's profile |
| `PATCH` | `/api/auth/me` | Update display_name and/or avatar_url |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Add a contact by phone_or_username |
| `GET` | `/api/contacts/search?q=` | Search users by name or username |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations` | List user's conversations (sorted by recent activity) |
| `POST` | `/api/conversations` | Create direct or group conversation |
| `GET` | `/api/conversations/<id>` | Get single conversation detail |
| `PATCH` | `/api/conversations/<id>` | Update group name/avatar (admin only) |
| `DELETE` | `/api/conversations/<id>/leave` | Leave group or delete direct chat |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations/<id>/messages` | List messages (excludes soft-deleted) |
| `POST` | `/api/conversations/<id>/messages` | Send a text message |
| `DELETE` | `/api/messages/<id>` | Soft-delete a message (sender only) |
| `POST` | `/api/conversations/<id>/read` | Mark all messages as read |

### Attachments & Reactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/messages/<id>/attachment` | Upload file attachment (max 25 MB) |
| `POST` | `/api/messages/<id>/reactions` | Add/replace emoji reaction |
| `DELETE` | `/api/messages/<id>/reactions` | Remove your reaction |

### Group Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/conversations/<id>/members` | List group members |
| `POST` | `/api/conversations/<id>/members` | Add member (admin only) |
| `DELETE` | `/api/conversations/<id>/members` | Remove member (admin only) |

### Disappearing Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/conversations/<id>/disappearing` | Set timer (0 = off) |

All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## WebSocket Protocol

### Connection

```
ws://host:8000/ws/chat/<conversation_id>/?token=<jwt_access_token>
```

The JWT is validated in middleware. Unauthenticated connections are closed with code `4401`; non-participants with `4403`.

### Client → Server Actions

```jsonc
// Send a message
{ "action": "send_message", "body": "Hello!", "reply_to": null }

// Typing indicator
{ "action": "typing", "is_typing": true }

// Mark messages as read
{ "action": "mark_read" }

// Add reaction
{ "action": "react", "message_id": "<uuid>", "emoji": "❤️" }

// Remove reaction
{ "action": "remove_react", "message_id": "<uuid>" }
```

### Server → Client Events

```jsonc
// New or updated message
{ "type": "message", "data": { /* full MessageSerializer output */ } }

// Typing indicator
{ "type": "typing", "user_id": "...", "display_name": "Alice", "is_typing": true }

// Read receipt
{ "type": "read_receipt", "user_id": "..." }

// Delivery receipt
{ "type": "delivery_receipt", "user_id": "..." }

// Settings update (disappearing timer, group name change)
{ "type": "settings_update", "disappearing_seconds": 300 }
```

### Reconnection

The frontend implements exponential backoff (1s → 2s → 4s → 8s → max 30s) with automatic reconnection on disconnect.

---

## Project Structure

```
signal-clone/
├── accounts/                    # Django app: users, auth, contacts
│   ├── models.py               # User (custom), Contact
│   ├── views.py                # register, login, me, contacts, search
│   ├── serializers.py          # Validation & representation
│   └── urls.py                 # /api/auth/*, /api/contacts*
│
├── chat/                        # Django app: messaging
│   ├── models.py               # Conversation, Participant, Message,
│   │                           # MessageStatus, Attachment, Reaction
│   ├── views.py                # REST endpoints for all chat operations
│   ├── serializers.py          # Validation & representation
│   ├── consumers.py            # WebSocket consumer (ChatConsumer)
│   ├── middleware.py           # JWT auth for WebSocket connections
│   ├── routing.py              # WebSocket URL routing
│   ├── urls.py                 # /api/conversations*, /api/messages*
│   └── management/commands/
│       └── seed_demo_data.py   # Database seeder
│
├── config/                      # Django project configuration
│   ├── settings.py             # All Django settings
│   ├── urls.py                 # Root URL configuration
│   ├── asgi.py                 # ASGI entrypoint (Daphne + Channels)
│   └── wsgi.py                 # WSGI fallback
│
├── frontend/                    # Next.js 16 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with metadata
│   │   │   ├── page.tsx        # Root redirect (→ /chat or /login)
│   │   │   ├── globals.css     # Signal design tokens (Tailwind theme)
│   │   │   ├── login/page.tsx  # Login form
│   │   │   ├── register/page.tsx # Multi-step registration
│   │   │   └── chat/
│   │   │       ├── layout.tsx  # Auth guard + sidebar layout
│   │   │       ├── page.tsx    # Empty state ("Select a conversation")
│   │   │       └── [id]/page.tsx # Conversation view + WebSocket
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # Left panel with chat/calls/stories tabs
│   │   │   ├── ConversationListItem.tsx # Single chat row (incl. Note to Self)
│   │   │   ├── MessageBubble.tsx       # Message bubble with receipts
│   │   │   ├── NewChatModal.tsx        # Create direct/group chat + Note to Self
│   │   │   ├── AddContactModal.tsx     # Add contact form
│   │   │   ├── SettingsPanel.tsx       # User settings panel
│   │   │   └── GroupInfoModal.tsx      # Group member management
│   │   └── lib/
│   │       ├── api.ts          # REST client (fetch wrapper + auth)
│   │       ├── types.ts        # TypeScript interfaces
│   │       └── ChatContext.tsx  # Shared state (active tab, settings)
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                 # Environment variable template
├── .gitignore
├── manage.py
├── render.yaml                  # Render deployment config
└── README.md                    # ← You are here
```

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ManshiSandilya/signal-clone.git
cd signal-clone
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Seed demo data (creates 4 users with conversations)
python manage.py seed_demo_data

# Start backend server
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

### 3. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000" >> .env.local

# Start development server
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:3000** in your browser.

---

## Seed Data

The `seed_demo_data` management command creates a ready-to-use environment:

| Username | Display Name | Password |
|----------|-------------|----------|
| `manu` | Manu | `password123` |
| `riya` | Riya Sharma | `password123` |
| `amit` | Amit Verma | `password123` |
| `sneha` | Sneha Patel | `password123` |

**Pre-created data:**
- All users are mutual contacts
- 1 direct conversation (Manu ↔ Riya) with 4 messages
- 1 group conversation ("College Squad") with all 4 users and 4 messages
- Emoji reactions on the latest messages

Login with any username above to explore immediately.

---

## Deployment

### Backend (Render)

The project includes a `render.yaml` for one-click deployment:

```bash
# Using Render Blueprint
# Just connect your GitHub repo and Render auto-deploys using render.yaml

# Or deploy manually:
# Set environment variables (see Environment Variables section below)
# Build command: ./build.sh
# Start command: daphne -b 0.0.0.0 -p $PORT config.asgi:application
```

### Frontend (Vercel)

```bash
cd frontend

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
# NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com

vercel --prod
```

---

## Environment Variables

### Backend (Render / Production)

Set these in your hosting provider's environment variable settings:

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `SECRET_KEY` | ✅ | `j-7pb2#v8=iq$kw0))*ti)...` | Django secret key. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | ✅ | `False` | **Must be `False` in production** |
| `ALLOWED_HOSTS` | ✅ | `signal-clone-backend-5so7.onrender.com` | Comma-separated list of allowed hostnames. **If empty, Django rejects all requests!** |
| `DATABASE_URL` | ✅ | `postgres://user:pass@host/db` | PostgreSQL connection string (provided by Render if using their DB) |
| `CORS_ALLOWED_ORIGINS` | Optional | `https://signal-clone-theta.vercel.app` | Not strictly needed since `CORS_ALLOW_ALL_ORIGINS=True`, but good for security |

> ⚠️ **Important:** If `ALLOWED_HOSTS` is set as an environment variable but left **empty**, Django will reject ALL incoming requests. Either set it to your domain or remove it entirely (defaults to `*`).

### Frontend (Vercel)

Set these in Vercel's Environment Variables settings:

| Variable | Required | Example Value | Description |
|----------|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `https://signal-clone-backend-5so7.onrender.com/api` | Backend REST API base URL |
| `NEXT_PUBLIC_WS_URL` | ✅ | `wss://signal-clone-backend-5so7.onrender.com` | Backend WebSocket base URL (use `wss://` for HTTPS) |

### Local Development

The `.env.local` file in `frontend/` should contain:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
```

---

## Assumptions & Design Decisions

1. **Mocked OTP** — The OTP is always `123456` and printed to console. A production system would integrate Twilio or similar.

2. **In-Memory Channel Layer** — WebSocket messages are broadcast via Django Channels' in-memory layer. This works for single-process deployments; production would use Redis (`channels_redis`).

3. **SQLite** — Chosen for zero-config setup. The schema is fully relational and would port to PostgreSQL without changes.

4. **JWT in localStorage** — Acceptable for this assignment scope. Production would use httpOnly cookies to prevent XSS token theft.

5. **No real E2E encryption** — Messages are stored in plaintext in SQLite. The UI simulates Signal's privacy UX, but no actual cryptographic protocols are implemented.

6. **Soft-delete for messages** — `is_deleted=True` and body cleared. The message row is preserved for referential integrity (reactions, statuses, reply_to chains).

7. **Lazy disappearing messages** — Messages are filtered at query time rather than deleted by a background job. Production would use Celery beat for periodic cleanup.

8. **File upload limit** — 25 MB server-side validation via `MAX_UPLOAD_SIZE` setting. Configurable in `settings.py`.

9. **Two-step attachment flow** — Create message first (JSON), then attach file (multipart). This keeps the message creation path simple and avoids mixed content types.

10. **Denormalized `last_message`** — Stored as a FK on `Conversation` for O(1) sidebar rendering. Updated atomically on every new message.

11. **Dark Theme Brand Identity & Chat Customization** — The app aligns with Signal Messenger's official dark mode color tokens:
    - **Background & Title Bar:** Hex `#202124` (RGB: `32, 33, 36`).
    - **Primary Brand Blue:** Hex `#3A76F0` (RGB: `58, 118, 240`).
    - **Icon Gradient (Top):** Hex `#4E84F2` (RGB: `78, 132, 242`).
    - **Icon Gradient (Bottom):** Hex `#3A76F0` (RGB: `58, 118, 240`).
    - **Chat Customization UI (Modular & Placeholder):** Designed to support custom wallpaper assignments, adjustable gradient color points, sliding gradient angles, or auto-matching bubble colors to the wallpaper.

---

## License

This project is built as an assignment submission. All code is original work.
