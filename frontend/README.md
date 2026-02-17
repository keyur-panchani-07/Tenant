# Multi-tenant Chat — Frontend

Next.js (App Router) + TypeScript + Tailwind. Connects to the existing backend API and Socket.IO.

## Setup

1. Copy env and set your backend URL:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   - `NEXT_PUBLIC_API_URL` — backend base URL (e.g. `http://localhost:3000`)
   - `NEXT_PUBLIC_SOCKET_URL` — Socket.IO URL (same as API if backend serves both)

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   App runs at [http://localhost:3001](http://localhost:3001) (Next.js default port).

## Features

- **Auth:** Login, Register org admin. JWT stored (Zustand persist). Route protection and tenant isolation at UI level.
- **Channels:** Sidebar list, create (admin), add member (admin). Only groups the user belongs to are shown.
- **Messages:** Load per channel, send text, own vs others styling, timestamps, auto-scroll. Real-time via Socket.IO (join_group, send_message, receive_message).

## Structure

- `app/` — Routes: `(auth)/login`, `(auth)/register`, `(dashboard)/dashboard`
- `components/` — Sidebar, ChatWindow, MessageBubble, ui (Button, Input, Modal)
- `lib/` — axios (with interceptor), env, validations (Zod), jwt decode
- `services/` — auth, group, message, socket
- `store/` — auth (Zustand)
- `hooks/` — useAuth, useSocket
- `types/` — Shared TypeScript types
