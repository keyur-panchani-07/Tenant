# Multi-Tenant Real-Time Messaging Application

A full-stack assignment project: **organization-scoped channels** with **role-based access control** (Admin / Member), **REST API**, and **real-time messaging** via Socket.IO. Each organization is isolated; users see only their org’s groups and messages.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [How It Works Together](#how-it-works-together)
- [API Endpoints](#api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Testing with cURL](#testing-with-curl)

---

## Tech Stack

| Layer    | Backend                          | Frontend                                      |
|----------|----------------------------------|-----------------------------------------------|
| Runtime  | Node.js                          | Next.js 16 (App Router)                       |
| Language | JavaScript                       | TypeScript                                   |
| API      | Express.js                       | Axios (with interceptors)                     |
| Auth     | JWT (Bearer), bcrypt             | Zustand (persist), JWT decode                 |
| DB       | PostgreSQL + Prisma             | —                                             |
| Real-time| Socket.IO                        | socket.io-client                              |
| Validation| express-validator               | React Hook Form + Zod                         |
| UI       | —                                | Tailwind CSS, Sonner (toast)                  |

---

## Project Structure

```
tenent/
├── backend/                    # Express + Prisma + Socket.IO
│   ├── prisma/
│   │   └── schema.prisma       # Organization, User, Group, GroupMember, Message
│   ├── src/
│   │   ├── app.js              # Express app, routes, Socket.IO server
│   │   ├── config/db.js        # Prisma client
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification → req.user
│   │   │   └── requireRole.js  # RBAC: allow only certain roles
│   │   ├── controllers/        # auth, group, message
│   │   ├── routes/             # auth, groups (+ messages under /groups)
│   │   └── socket/
│   │       └── socket.handler.js # Socket.IO auth, join_group, send_message
│   ├── .env.example
│   └── package.json
│
├── frontend/                   # Next.js App Router + TypeScript
│   ├── app/
│   │   ├── (auth)/             # login, register (org admin)
│   │   ├── (dashboard)/        # protected dashboard + channels UI
│   │   ├── layout.tsx
│   │   └── page.tsx            # redirects to /dashboard or /login
│   ├── components/             # Sidebar, ChatWindow, MessageBubble, ui/*
│   ├── hooks/                  # useAuth, useSocket
│   ├── lib/                    # axios, env, jwt, validations (Zod)
│   ├── services/               # auth, group, message, socket
│   ├── store/                  # auth (Zustand)
│   ├── types/
│   ├── .env.local.example
│   └── package.json
│
└── README.md                   # This file
```

---

## Features

### Backend

- **Multi-tenancy**  
  Every user belongs to one organization (`orgId`). All group and message access is scoped by `orgId`; no cross-org data leakage.

- **Role-based access control (RBAC)**  
  - **ADMIN**: Can create groups, add members to groups, and invite new members to the org.  
  - **MEMBER**: Can log in, list their groups, read/send messages in groups they belong to. Cannot create groups or add/invite users.

- **Authentication**  
  - Register org admin: creates a new organization and an admin user.  
  - Login: same endpoint for admin and member; JWT includes `userId`, `orgId`, `role`.  
  - Invite member: admin-only; creates a new user with role MEMBER in the same org (no token returned; invited user uses login with the given credentials).

- **Groups (channels)**  
  - Create group: admin only; group is tied to admin’s org.  
  - List groups: returns only groups the authenticated user is a member of (and in their org).  
  - Add member to group: admin only; target user must be in the same org.

- **Messages**  
  - Get messages: authenticated user must be a member of the group; results scoped by org/membership.  
  - Send message: same membership check; message is persisted and broadcast via Socket.IO to the group room.

- **Real-time (Socket.IO)**  
  - Connection requires JWT in `handshake.auth.token`.  
  - Client emits `join_group` with `groupId`; server verifies org + membership, then joins socket to room `org:{orgId}:group:{groupId}`.  
  - Client emits `send_message` with `groupId` and `content`; server validates, saves message, and emits `receive_message` to the room.  
  - Ensures users only join and receive messages for their own org’s groups.

### Frontend

- **Auth**  
  - Login page: email + password; works for both admin and member.  
  - Register page: “Register as org admin” (org name + email + password).  
  - JWT stored (Zustand persist); axios interceptor adds `Authorization: Bearer <token>`; 401 triggers logout and redirect.

- **Dashboard (protected)**  
  - Sidebar: list of channels (groups) the user is in; “Create channel” and “Add member” only for admin.  
  - Chat area: select a channel, load messages (REST), send message (REST); real-time updates via Socket.IO (`receive_message`).  
  - Modals: create group, add member to group (by userId).

- **UX**  
  - Loading/empty/error states; toasts (Sonner); responsive layout; own vs others’ message bubbles; timestamps.

---

## How It Works Together

1. **Org admin** registers via frontend → `POST /auth/register-org-admin` → backend creates org + admin user → returns token; frontend stores it and redirects to dashboard.  
2. **Member** can be created by admin via `POST /auth/invite-member` (backend only; frontend can call it from an “Invite member” flow). Member then uses the same **login** page with the credentials set by admin.  
3. **Login** (admin or member) → `POST /auth/login` → JWT with `userId`, `orgId`, `role` → frontend stores token and user; all subsequent API calls send `Authorization: Bearer <token>`.  
4. **Dashboard** loads → `GET /groups` → user sees only groups they are a member of (backend filters by membership + org).  
5. **Admin** can create a group → `POST /groups` (body: `name`) → then add themselves to it (e.g. `POST /groups/:groupId/members` with their `userId`) so it appears in the list; or backend can be extended to auto-add creator.  
6. **Admin** adds a member to a group → `POST /groups/:groupId/members` (body: `userId`) → that user will see the group on next load.  
7. **Selecting a channel** → frontend fetches `GET /groups/:groupId/messages` and opens Socket.IO room via `join_group` → messages load; new messages (sent via REST or Socket) are received as `receive_message` and appended to the list.  
8. **Sending a message** → frontend uses `POST /groups/:groupId/messages` (body: `content`) → backend saves and broadcasts to the Socket room so all clients in that channel get it in real time.

Tenant isolation is enforced in the backend on every route and in Socket handlers (org + membership checks). The frontend uses `orgId` and `role` from the token for UI only; it does not bypass API checks.

---

## API Endpoints

Base URL: `http://localhost:<BACKEND_PORT>` (e.g. `http://localhost:5000`).

### Health

| Method | Endpoint   | Auth | Description        |
|--------|------------|------|--------------------|
| GET    | `/health`  | No   | Server health check |

### Auth

| Method | Endpoint                   | Auth    | Body / Notes                                      | Description                    |
|--------|-----------------------------|---------|----------------------------------------------------|--------------------------------|
| POST   | `/auth/register-org-admin`  | No      | `orgName`, `email`, `password` (min 6 chars)       | Create org + admin user        |
| POST   | `/auth/login`               | No      | `email`, `password`                                | Login (admin or member)        |
| POST   | `/auth/invite-member`       | Bearer (ADMIN) | `email`, `password` (min 6 chars)           | Create member in same org     |

### Groups

| Method | Endpoint                  | Auth         | Body / Params                    | Description              |
|--------|---------------------------|--------------|----------------------------------|--------------------------|
| GET    | `/groups`                 | Bearer       | —                                | List my groups           |
| POST   | `/groups`                 | Bearer (ADMIN) | `name`                          | Create group             |
| POST   | `/groups/:groupId/members`| Bearer (ADMIN) | `userId`                        | Add member to group      |

### Messages

| Method | Endpoint                        | Auth   | Body / Params / Query              | Description        |
|--------|----------------------------------|--------|------------------------------------|--------------------|
| GET    | `/groups/:groupId/messages`     | Bearer | `groupId` (path), `limit` (query, default 50, max 100) | Get messages (chronological) |
| POST   | `/groups/:groupId/messages`     | Bearer | `groupId` (path), `content` (body)  | Send message       |

**Auth header for protected routes:**  
`Authorization: Bearer <JWT>`

**Typical responses:**  
- `200` / `201` with JSON body.  
- `400` validation error (e.g. `{ errors: [...] }` or `{ error: "..." }`).  
- `401` missing or invalid token.  
- `403` forbidden (e.g. not a member of group, or insufficient role).  
- `404` resource not found.  
- `409` conflict (e.g. org name or email already exists, or duplicate group name in org).

---

## Socket.IO Events

**Server URL:** Same as API base (e.g. `http://localhost:5000`).  
**Connection:** Pass JWT in handshake: `auth: { token: "<JWT>" }`.

### Client → Server

| Event          | Payload              | Description                          |
|----------------|----------------------|--------------------------------------|
| `join_group`   | `{ groupId }`        | Join room for that group (org + membership checked) |
| `send_message` | `{ groupId, content }` | Send message to group (saved and broadcast)      |

### Server → Client

| Event            | Payload                                                                 | Description                    |
|------------------|-------------------------------------------------------------------------|--------------------------------|
| `joined_group`   | `{ groupId, room }`                                                     | Confirmation of joining room   |
| `receive_message`| `{ id, content, groupId, sender: { id, email }, createdAt }`           | New message in the room        |
| `error`          | `{ message }`                                                          | Validation or server error     |

---

## Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm (or yarn)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, PORT, CLIENT_ORIGIN
npm install
npx prisma generate
npx prisma migrate dev   # or npx prisma db push
npm run dev
```

Server runs at `http://localhost:<PORT>` (default 3000 if not set).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL to backend URL (e.g. http://localhost:5000)
npm install
npm run dev
```

App runs at `http://localhost:3000` (or next available port). Use the UI to register an org admin, log in, create groups, add members, and send messages.

---

## Environment Variables

### Backend (`.env`)

| Variable       | Description                          | Example / default     |
|----------------|--------------------------------------|------------------------|
| DATABASE_URL   | PostgreSQL connection string         | `postgresql://...`    |
| JWT_SECRET     | Secret for signing JWTs              | Long random string     |
| PORT           | HTTP + Socket.IO server port         | `5000`                 |
| CLIENT_ORIGIN  | Allowed CORS origin (frontend URL)   | `http://localhost:3000` |

### Frontend (`.env.local`)

| Variable                 | Description              | Example                |
|--------------------------|--------------------------|------------------------|
| NEXT_PUBLIC_API_URL      | Backend base URL         | `http://localhost:5000` |
| NEXT_PUBLIC_SOCKET_URL   | Socket.IO server URL     | `http://localhost:5000` |

---

## Testing with cURL

Replace `BASE=http://localhost:5000` with your backend URL and port. After login, set `TOKEN` and use it in `Authorization: Bearer $TOKEN`.

### 1. Health check

```bash
BASE=http://localhost:5000
curl -s "$BASE/health"
# Expected: {"status":"ok"}
```

### 2. Register org admin

```bash
curl -s -X POST "$BASE/auth/register-org-admin" \
  -H "Content-Type: application/json" \
  -d '{"orgName":"Acme Corp","email":"admin@acme.com","password":"secret123"}'
# Expected: 201 with { token, user: { id, email, role: "ADMIN" }, org: { id, name } }
# Save the token as TOKEN for next steps.
```

### 3. Login (admin or member)

```bash
curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"secret123"}'
# Expected: 200 with { token, user: { id, email, role, orgId } }
# Use this token as TOKEN below.
```

### 4. Invite member (admin only)

```bash
TOKEN="<your_admin_jwt>"
curl -s -X POST "$BASE/auth/invite-member" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"member@acme.com","password":"member123"}'
# Expected: 201 with { user: { id, email, role: "MEMBER", orgId } }
```

### 5. List groups

```bash
curl -s "$BASE/groups" -H "Authorization: Bearer $TOKEN"
# Expected: 200 with array of groups (may be [] if none yet)
```

### 6. Create group (admin only)

```bash
curl -s -X POST "$BASE/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"general"}'
# Expected: 201 with { id, name, orgId, createdAt }
# Save group id as GROUP_ID for next steps.
```

### 7. Add member to group (admin only)

```bash
GROUP_ID="<group_id_from_above>"
MEMBER_USER_ID="<user_id_of_member_to_add>"   # e.g. from invite-member response
curl -s -X POST "$BASE/groups/$GROUP_ID/members" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":\"$MEMBER_USER_ID\"}"
# Expected: 200 with { message: "Member added successfully" }
```

### 8. Get messages

```bash
curl -s "$BASE/groups/$GROUP_ID/messages" -H "Authorization: Bearer $TOKEN"
# Optional: ?limit=20
# Expected: 200 with array of messages (chronological)
```

### 9. Send message

```bash
curl -s -X POST "$BASE/groups/$GROUP_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Hello from cURL!"}'
# Expected: 201 with created message object
```

### 10. 401 without token (protected route)

```bash
curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE/groups" 
# Expected: {"error":"Missing token"} and HTTP 401
```

### 11. 403 as member (create group)

If you have a MEMBER token (e.g. after logging in as `member@acme.com`):

```bash
MEMBER_TOKEN="<member_jwt>"
curl -s -X POST "$BASE/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"name":"random"}'
# Expected: 403 with { error: "Forbidden: insufficient role" }
```

---

## Summary

This project implements a **multi-tenant messaging** system with **strict tenant isolation** and **role-based access**. The **backend** exposes REST APIs for auth, groups, and messages, plus Socket.IO for real-time delivery. The **frontend** provides login, org-admin registration, dashboard with channels and chat, and real-time updates. All API endpoints and Socket events are documented above; the cURL section can be used to verify behavior for an assignment or integration testing.
