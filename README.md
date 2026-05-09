# Messenger — Real-time messaging platform

A full-stack messenger with real-time messaging, group chats with topics, file attachments, voice messages, and WebRTC video calls. Built as a final university project.

![Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)

## ✨ Features

### Messaging
- **Real-time direct messaging** via Socket.io with delivery and read receipts (✓✓)
- **Group chats** with member management
- **Supergroups with topics** — Slack-like channel organization (default "General" topic + custom topics with emojis)
- **Typing indicators** that update in real-time across clients
- **Online/offline presence** with last-seen timestamps

### Attachments
- **Images, videos, audio files, and documents** up to 50MB
- **In-message preview** for images and videos, inline player for audio
- **Drag-and-drop** support in chat input
- **Voice messages** recorded directly in the browser via MediaRecorder API

### Calls
- **WebRTC peer-to-peer audio and video calls** (1-on-1)
- Socket.io as signaling server, public Google STUN servers for NAT traversal
- In-call controls: mute microphone, toggle camera, end call
- Picture-in-picture for local video stream during video calls

### Profiles & Personalization
- Customizable profiles with avatar, display name, bio, and status
- Avatar upload for users and group chats
- Click any avatar to view that user's profile
- Dark mode with persistent theme preference

### Notifications
- Toast notifications for new messages in inactive chats
- Audio notification sound on new messages
- Tab title updates with unread counter (`(3) Messenger`)
- Per-chat unread badges in the sidebar

### Authentication
- JWT-based stateless authentication
- Bcrypt password hashing
- Session persistence via localStorage
- Protected REST routes and Socket.io connections

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** for components
- **Zustand** for state management with persist middleware
- **Socket.io-client** for real-time
- **WebRTC API** for video calls
- **MediaRecorder API** for voice messages
- **React Hook Form** + **Zod** for forms and validation
- **Sonner** for toast notifications
- **date-fns** for date formatting
- **Lucide** for icons

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Socket.io** for WebSocket transport
- **PostgreSQL** + **Prisma** ORM
- **JWT** for auth
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Zod** for input validation
- **Helmet** + **CORS** for security

### Infrastructure
- **Docker Compose** for local PostgreSQL
- **Monorepo** structure (`/frontend` + `/backend`)

## 📂 Project Structure

\`\`\`
messenger/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Test users seed
│   ├── src/
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/              # Register, login, JWT
│   │   │   ├── users/             # Profile management
│   │   │   ├── chats/             # Chats, members, topics
│   │   │   └── uploads/           # Universal file upload
│   │   ├── socket/                # Socket.io handlers
│   │   │   ├── auth.socket.ts     # JWT auth for sockets
│   │   │   ├── chat.handlers.ts   # Messages, typing, read
│   │   │   ├── call.handlers.ts   # WebRTC signaling
│   │   │   └── presence.ts        # Online/offline tracking
│   │   ├── middleware/            # Auth, validation, errors
│   │   └── server.ts              # Entry point
│   └── uploads/                   # Local file storage
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/            # Login, register
        │   └── (main)/            # Protected routes
        │       ├── chats/         # Chat interface
        │       └── profile/       # User profiles
        ├── components/
        │   ├── auth/
        │   ├── chat/              # Chat UI components
        │   ├── profile/
        │   ├── call/              # Call modals and window
        │   └── shared/            # ThemeToggle etc.
        ├── hooks/                 # useAuth, useSocket, useCall
        ├── store/                 # Zustand stores
        └── lib/                   # API client, socket, WebRTC
\`\`\`

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Docker Desktop** (for PostgreSQL)
- A modern browser with WebRTC support (Chrome, Firefox, Edge)

### Setup

**1. Clone the repository**

\`\`\`bash
git clone https://github.com/erbstroke-jpg/WebDevFinalProject
cd messenger
\`\`\`

**2. Start PostgreSQL**

\`\`\`bash
docker compose up -d
\`\`\`

**3. Set up the backend**

\`\`\`bash
cd backend
npm install

# Create .env file (see backend/.env.example below)
cp .env.example .env

# Run migrations and seed test users
npx prisma migrate dev --name init
npm run prisma:seed

# Start the dev server
npm run dev
\`\`\`

Backend will run at `http://localhost:4000`.

**4. Set up the frontend**

In a new terminal:

\`\`\`bash
cd frontend
npm install

# Create .env.local (see frontend/.env.local.example below)
cp .env.local.example .env.local

# Start the dev server
npm run dev
\`\`\`

Frontend will run at `http://localhost:3000`.

**5. Open the app**

Visit [http://localhost:3000](http://localhost:3000) and log in with the seeded test accounts:

- `alice@test.com` / `password123`
- `bob@test.com` / `password123`

To test real-time messaging and calls, open the app in two browser windows (one regular, one Incognito to keep sessions separate).

## ⚙️ Environment Variables

### `backend/.env`

\`\`\`bash
DATABASE_URL="postgresql://messenger:messenger_dev_pass@localhost:5432/messenger_db?schema=public"

PORT=4000
NODE_ENV=development

JWT_SECRET="change_me_to_a_long_random_string"
JWT_EXPIRES_IN="7d"

FRONTEND_URL="http://localhost:3000"

UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=50
\`\`\`

### `frontend/.env.local`

\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
\`\`\`

## 🗄 Database Schema

The schema uses a single `Chat` entity discriminated by `type` (`DIRECT` / `GROUP` / `SUPERGROUP`), which keeps membership and message logic unified across chat types. Topics belong only to supergroups.

Core entities:
- **User** — accounts and profiles
- **Chat** — direct, group, or supergroup
- **ChatMember** — membership with roles (OWNER, ADMIN, MEMBER)
- **Topic** — sub-channels within supergroups
- **Message** — text or attachment with replies and read receipts
- **MessageRead** — read receipts for the ✓✓ indicator
- **Notification** — in-app notifications

Run `npx prisma studio` in the backend folder to inspect the database visually.

## 🏗 Architecture Notes

### Real-time messaging
Messages are sent **through Socket.io**, not REST — this is the canonical pattern for real-time apps. The backend persists the message and broadcasts `message:new` to everyone in the chat room (`chat:{chatId}`). REST is only used to load message history with cursor-based pagination.

### Authentication on sockets
A custom Socket.io middleware verifies JWT on connection. The user's ID is attached to `socket.data` and used in every handler. Failed auth = no connection.

### WebRTC calls
- **Signaling** via Socket.io: `call:invite`, `call:accept`, `call:offer`, `call:answer`, `call:ice`
- **Media** flows peer-to-peer between browsers, not through the server
- **STUN servers** (Google public) for NAT traversal
- TURN servers would be needed for production deployments where peers can't establish a direct connection — for academic/demo purposes STUN is sufficient

### Universal file uploads
A single `POST /api/uploads` endpoint handles all file uploads (message attachments, user avatars, group avatars). Multer routes files into subdirectories by MIME type. Frontend code reuses one `uploadFile()` helper everywhere.

### State management
- **Zustand stores** for auth, chats, calls
- Persistence (localStorage) only for the auth store
- Real-time updates flow `Socket.io → useSocket hook → Zustand actions → React re-render`

## 🧪 Test Accounts

After running `npm run prisma:seed`:

| Email | Password | Username |
|-------|----------|----------|
| alice@test.com | password123 | alice |
| bob@test.com | password123 | bob |

Register additional accounts via `/register` to test groups and supergroups.

## 📝 Limitations

- **Group video calls** are not supported (would require an SFU server like mediasoup)
- **TURN server** is not configured — calls between peers behind strict NATs may fail in production
- **Voice message format** is `audio/webm` (not supported in Safari without server-side conversion)
- **No message editing or deletion** in the current UI (database supports it via `isEdited`/`isDeleted` flags)
- **No push notifications** outside the browser tab (would require Service Worker + Web Push)

## 📜 License

MIT — academic project, free to use as a reference.

## 👤 Author

Built by Erbol as a final university project for the Web Development course, May 2026.