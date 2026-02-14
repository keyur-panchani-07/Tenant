# Tenant Messaging Backend

Real-time multi-tenant messaging API built with Node.js, Express, Socket.IO, and PostgreSQL (Prisma).

---

## Setup

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate           # run Prisma migrations
npm run dev                  # start with hot-reload (nodemon)
```

---

## API Reference

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/auth/register-org-admin` | `{ orgName, email, password }` | Creates organization + admin user, returns JWT |
| POST | `/auth/login` | `{ email, password }` | Returns JWT |

JWT payload: `{ userId, orgId, role }`
Include in requests: `Authorization: Bearer <token>`

### Groups *(requires JWT)*

| Method | Path | Body | Role | Description |
|--------|------|------|------|-------------|
| POST | `/groups` | `{ name }` | ADMIN | Create a group |
| GET | `/groups` | — | Any | List groups the user is a member of |
| POST | `/groups/:groupId/members` | `{ userId }` | ADMIN | Add a user to the group |

### Messages *(requires JWT)*

| Method | Path | Query / Body | Description |
|--------|------|--------------|-------------|
| GET | `/groups/:groupId/messages` | `?limit=50` | Fetch last N messages (max 100) |
| POST | `/groups/:groupId/messages` | `{ content }` | Send a message + broadcast via Socket.IO |

---

## Socket.IO

**Connection**
```js
const socket = io('http://localhost:3000', {
  auth: { token: '<JWT>' }
});
```

**Events**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_group` | client → server | `{ groupId }` | Join a group room |
| `joined_group` | server → client | `{ groupId, room }` | Confirmation |
| `send_message` | client → server | `{ groupId, content }` | Send a message |
| `receive_message` | server → client | `{ id, content, groupId, sender, createdAt }` | Incoming message |
| `error` | server → client | `{ message }` | Auth or authorization error |

---

## Tenant Isolation Strategy

### 1. Database Layer
Every query is scoped to the authenticated user's `orgId`:
- Groups are created with `orgId` and queried only within the same org
- Before any group or message operation the server verifies `group.orgId === req.user.orgId`
- `orgId` is **never** read from the request body — it is always sourced from the JWT

### 2. JWT Layer
The token encodes `{ userId, orgId, role }`. The `authenticate` middleware verifies the signature and rejects expired or tampered tokens. All downstream logic trusts `req.user` exclusively.

### 3. Socket Layer
Room names follow the pattern `org:{orgId}:group:{groupId}`.
- The org prefix ensures rooms from different organizations never collide, even if two orgs happen to create a group with the same database ID (impossible with CUID, but still a good pattern).
- Before joining a room, the server re-validates group ownership and membership.
- `io.to(room).emit(...)` broadcasts only to sockets in that exact room, so no user from another org can receive those events.

### 4. Authorization Checks
- Creating groups and adding members requires `role === ADMIN`
- Reading or sending messages requires the user to be an explicit `GroupMember`
- Admin role from a different org is meaningless — the org scope check comes first
