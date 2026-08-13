# Signal Clone - Secure Messaging Platform

A full-stack implementation of a Signal messenger clone built with Next.js, Django, and WebSockets. This application replicates Signal's core messaging workflows with real-time messaging, contact management, and group conversations.

## 🎯 Features

### Core Features
- **Authentication**: Registration, login/logout with mocked OTP verification
- **One-on-One Messaging**: Real-time direct messages with delivery/read receipts
- **Group Messaging**: Create groups, manage members, send group messages
- **Contacts**: Add and manage contacts with custom nicknames
- **Presence**: Online status and last-seen indicators
- **Message Status**: Sending → Sent → Delivered → Read progression
- **Typing Indicators**: Real-time typing notifications

### Bonus Features
- **Message Reactions**: React to messages with emoji
- **Attachments**: File attachment support (UI implemented)
- **Disappearing Messages**: Configure message auto-deletion timers
- **Dark Mode Ready**: Tailwind CSS styling system

## 📋 Tech Stack

- **Frontend**: Next.js 14 (TypeScript) with Tailwind CSS
- **Backend**: Django with Django REST Framework
- **Real-time**: WebSockets via Django Channels
- **Database**: SQLite
- **Authentication**: JWT (rest_framework_simplejwt)
- **Async**: Channels with async context

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQLite3

### Backend Setup

```bash
# Navigate to backend
cd d:/signal-clone

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create sample data (optional)
python manage.py seed_demo_data

# Run development server
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set environment variables (create .env.local)
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000" >> .env.local

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🏗️ Architecture Overview

### Frontend Architecture
```
frontend/
├── app/
│   ├── login/          # Login page
│   ├── register/       # Registration flow
│   ├── chat/           # Chat interface
│   │   ├── page.tsx    # Conversation list
│   │   └── [id]/       # Individual conversation
│   └── layout.tsx      # Root layout with sidebar
├── components/         # Reusable UI components
│   ├── Sidebar.tsx     # Conversation list + navigation
│   ├── MessageBubble.tsx # Message display with reactions
│   ├── NewChatModal.tsx # New conversation modal
│   ├── AddContactModal.tsx # Add contact modal
│   └── GroupInfoModal.tsx  # Group info & member management
├── lib/
│   ├── api.ts          # API client functions
│   └── types.ts        # TypeScript type definitions
└── globals.css         # Tailwind & global styles
```

### Backend Architecture
```
backend/
├── config/             # Django settings & ASGI
├── accounts/           # Authentication & user management
│   ├── models.py       # User & Contact models
│   ├── views.py        # Auth endpoints
│   └── serializers.py  # DRF serializers
├── chat/               # Messaging
│   ├── models.py       # Conversation, Message, etc.
│   ├── views.py        # REST endpoints
│   ├── consumers.py    # WebSocket handlers
│   ├── routing.py      # WebSocket URL routing
│   └── serializers.py  # Message serializers
└── db.sqlite3          # Database
```

### Technology Decisions
- **WebSockets via Channels**: Real-time messaging with bidirectional communication
- **JWT Authentication**: Stateless, scalable authentication
- **Async Views**: Non-blocking WebSocket handlers for concurrency
- **DRF for REST**: Clean, testable API layer
- **Next.js App Router**: Modern, file-based routing with SSR ready

## 📦 Database Schema

### User Model
```sql
CREATE TABLE accounts_user (
  id VARCHAR(36) PRIMARY KEY,
  phone_or_username VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  avatar_url VARCHAR(200),
  is_online BOOLEAN DEFAULT FALSE,
  last_seen DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Contact Model
```sql
CREATE TABLE accounts_contact (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) REFERENCES accounts_user(id),
  contact_user_id VARCHAR(36) REFERENCES accounts_user(id),
  nickname VARCHAR(255),
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, contact_user_id)
);
```

### Conversation Model
```sql
CREATE TABLE chat_conversation (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(10), -- 'direct' or 'group'
  name VARCHAR(150), -- NULL for direct
  avatar_url VARCHAR(200),
  created_by_id VARCHAR(36) REFERENCES accounts_user(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_id VARCHAR(36),
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disappearing_seconds INTEGER DEFAULT 0
);
```

### ConversationParticipant Model
```sql
CREATE TABLE chat_conversationparticipant (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) REFERENCES chat_conversation(id),
  user_id VARCHAR(36) REFERENCES accounts_user(id),
  role VARCHAR(10) DEFAULT 'member', -- 'member' or 'admin'
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);
```

### Message Model
```sql
CREATE TABLE chat_message (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) REFERENCES chat_conversation(id),
  sender_id VARCHAR(36) REFERENCES accounts_user(id),
  body TEXT NOT NULL,
  reply_to_id VARCHAR(36) REFERENCES chat_message(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

### MessageStatus Model
```sql
CREATE TABLE chat_messagestatus (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) REFERENCES chat_message(id),
  user_id VARCHAR(36) REFERENCES accounts_user(id),
  status VARCHAR(10), -- 'sent', 'delivered', 'read'
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);
```

### Attachment Model
```sql
CREATE TABLE chat_attachment (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) REFERENCES chat_message(id),
  file VARCHAR(500),
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Reaction Model
```sql
CREATE TABLE chat_reaction (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) REFERENCES chat_message(id),
  user_id VARCHAR(36) REFERENCES accounts_user(id),
  emoji VARCHAR(8),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP (mocked)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Contacts
- `GET /api/contacts` - List user's contacts
- `POST /api/contacts` - Add new contact
- `GET /api/contacts/search?q=query` - Search users

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/{id}` - Get conversation details
- `GET /api/conversations/{id}/messages` - Get messages
- `POST /api/conversations/{id}/messages` - Send message (REST)
- `POST /api/conversations/{id}/read` - Mark as read
- `GET /api/conversations/{id}/members` - List members
- `POST /api/conversations/{id}/members` - Add member
- `DELETE /api/conversations/{id}/members` - Remove member
- `POST /api/conversations/{id}/disappearing` - Set disappearing timer

### Messages
- `POST /api/messages/{id}/attachment` - Upload attachment
- `POST /api/messages/{id}/reactions` - Add reaction
- `DELETE /api/messages/{id}/reactions` - Remove reaction

### WebSocket
- **URL**: `ws://127.0.0.1:8000/ws/chat/{conversation_id}/?token={jwt_token}`
- **Actions**:
  - `send_message`: `{"action": "send_message", "body": "text"}`
  - `typing`: `{"action": "typing", "is_typing": true}`
  - `mark_read`: `{"action": "mark_read"}`
  - `react`: `{"action": "react", "message_id": "id", "emoji": "😀"}`

## 🔐 Authentication Flow

1. **Registration**:
   - User enters phone/username and password
   - System sends OTP (mocked, always "123456")
   - User enters OTP
   - User fills profile (display name)
   - Account created, JWT tokens returned

2. **Login**:
   - User enters phone/username and password
   - System validates credentials
   - JWT tokens returned, stored in localStorage

3. **Token Usage**:
   - Access token sent in `Authorization: Bearer <token>` header
   - Refresh token stored for future token renewal
   - Token lifetime: 7 days (configurable)

## 🔄 Message Status Flow

1. **Sending**: Initial local state while waiting for server ACK
2. **Sent**: Server accepted, stored in DB, "single tick" displayed
3. **Delivered**: Recipient WebSocket connection received the message, "double tick"
4. **Read**: Recipient marked message as read, "blue double tick"

### Important Notes
- REST path creates "sent" status for other users
- WebSocket path creates "sent" status (updated to match REST)
- Status updates broadcast to all conversation participants in real-time
- Own messages show tick progression based on other users' statuses

## 📁 Project Structure

```
signal-clone/
├── frontend/                 # Next.js frontend
├── config/                   # Django settings
├── accounts/                 # User & auth app
├── chat/                     # Messaging app
├── manage.py
├── db.sqlite3
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## 🧪 Testing

### Backend Tests
```bash
python manage.py test accounts chat
```

### Frontend Tests (Vitest/Jest)
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend (Render/Railway/Heroku)
1. Set `DEBUG = False` in settings.py
2. Configure `ALLOWED_HOSTS`
3. Set up PostgreSQL for production
4. Deploy with: `git push heroku main` or equivalent
5. Run migrations: `heroku run python manage.py migrate`

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
3. Deploy automatically on push

## 🔐 Security Considerations

**Production Checklist**:
- [ ] Change `SECRET_KEY` in settings.py
- [ ] Set `DEBUG = False`
- [ ] Configure CORS properly (not `*`)
- [ ] Use HTTPS/WSS only
- [ ] Set `SECURE_SSL_REDIRECT = True`
- [ ] Configure CSRF settings for production
- [ ] Use strong passwords for test accounts
- [ ] Implement rate limiting on auth endpoints
- [ ] Add input validation for file uploads
- [ ] Implement proper encryption for sensitive data

## 🎨 Design System

### Colors (Tailwind)
- `signal-blue`: Primary accent (#3B82F6)
- `signal-bg`: Light background (#FFFFFF)
- `signal-sidebar`: Sidebar background (#F3F3F3)
- `signal-border`: Border color (#E5E5E5)
- `signal-text`: Primary text (#000000)
- `signal-text-muted`: Muted text (#999999)

### Components
All components follow Signal's design language:
- Rounded buttons and inputs (rounded-full, rounded-lg)
- Subtle shadows and borders
- Clean whitespace and typography
- Responsive design (320px+)

## 🐛 Known Limitations & Future Improvements

### Limitations
1. **OTP is mocked** - Always "123456", no real SMS/email
2. **No encryption** - Messages sent in plaintext (can be enhanced)
3. **File storage** - Attachments stored locally (use cloud storage for production)
4. **No video calls** - Listed as placeholder/coming soon
5. **No end-to-end encryption** - Keys exchanged but not used for encryption

### Future Improvements
1. Implement real E2E encryption (Signal protocol)
2. Add voice/video call support (WebRTC)
3. Implement message search
4. Add story/status feature
5. Multi-device support
6. Message pinning
7. Custom themes
8. Message reactions limit to available emoji set

## 📚 Documentation

### Setup Instructions
- [Backend Setup](docs/BACKEND_SETUP.md)
- [Frontend Setup](docs/FRONTEND_SETUP.md)

### Development
- [API Reference](docs/API.md)
- [WebSocket Events](docs/WEBSOCKET.md)
- [Component Guide](docs/COMPONENTS.md)

## 🤝 Contributing

This is an assignment project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make changes with clear commit messages
4. Submit a pull request

## 📄 License

This project is provided as-is for educational purposes.

## 👨‍💼 Support

For issues or questions:
1. Check the troubleshooting section below
2. Review the codebase comments
3. Check Django/Next.js documentation

### Troubleshooting

**WebSocket Connection Fails**
- Ensure Daphne is running (Django Channels)
- Check ASGI configuration in settings.py
- Verify WebSocket URL includes JWT token

**Messages Not Appearing**
- Check browser DevTools Console for errors
- Verify WebSocket connection status
- Ensure message database was created

**Authentication Issues**
- OTP is always "123456" in mocked mode
- Check JWT token expiration (7 days)
- Ensure localStorage is enabled

**CORS Errors**
- Verify `CORS_ALLOW_ALL_ORIGINS = True` (or configure specific origins)
- Check origin headers in browser requests

## 🎓 Learning Resources

- [Django Channels Documentation](https://channels.readthedocs.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Signal Protocol](https://signal.org/docs/) (for reference)

---

**Last Updated**: 2026-08-13
**Version**: 1.0.0
