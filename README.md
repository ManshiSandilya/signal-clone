# Signal Clone — Secure Messaging Platform

A full-stack, real-time messaging application that faithfully replicates Signal Messenger's design, user experience, and core workflows. Built as a single-page application with a split-pane layout (conversation list + chat pane), real-time WebSocket messaging, and a privacy-focused interface.

![Tech Stack](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Backend-Django_6.1-092E20?logo=django)
![Tech Stack](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)
![Tech Stack](https://img.shields.io/badge/Realtime-WebSockets-010101?logo=websocket)
![Tech Stack](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)

---

## Table of Contents

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
- [Assumptions & Design Decisions](#assumptions--design-decisions)

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
| **Dark/Light UI** | Signal's clean, white-and-blue design language |

### Placeholder Sections

| Feature | Status |
|---------|--------|
| Voice / Video Calls | Placeholder in settings menu |
| Stories | Placeholder |
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
│   │   │   ├── Sidebar.tsx             # Left panel with chat list
│   │   │   ├── ConversationListItem.tsx # Single chat row
│   │   │   ├── MessageBubble.tsx       # Message bubble with receipts
│   │   │   ├── NewChatModal.tsx        # Create direct/group chat
│   │   │   ├── AddContactModal.tsx     # Add contact form
│   │   │   └── GroupInfoModal.tsx      # Group member management
│   │   └── lib/
│   │       ├── api.ts          # REST client (fetch wrapper + auth)
│   │       └── types.ts        # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                 # Environment variable template
├── .gitignore
├── manage.py
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
git clone https://github.com/<your-username>/signal-clone.git
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
pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers channels daphne python-dotenv

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

### Backend (Render / Railway / Any VPS)

```bash
# Install production dependencies
pip install gunicorn whitenoise

# Set environment variables
export DEBUG=False
export SECRET_KEY=<strong-random-key>
export ALLOWED_HOSTS=your-domain.com
export CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Run with Daphne (required for WebSocket support)
daphne -b 0.0.0.0 -p $PORT config.asgi:application
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

---

## License

This project is built as an assignment submission. All code is original work.
