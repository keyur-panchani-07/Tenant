import { io, Socket } from 'socket.io-client';
import { env } from '@/lib/env';

/** Socket.IO client. Authenticate with JWT in handshake; backend validates and enforces tenant isolation per room. */
let socket: Socket | null = null;

export function getSocket(token: string | null): Socket | null {
  if (!token || typeof window === 'undefined') return null;
  if (socket?.connected) return socket;

  socket = io(env.socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Emit join_group; only rooms for user's org are joinable (backend checks membership). */
export function joinGroup(s: Socket, groupId: string) {
  s.emit('join_group', { groupId });
}

/** Emit send_message; backend validates group membership and org before broadcasting. */
export function sendMessageSocket(s: Socket, groupId: string, content: string) {
  s.emit('send_message', { groupId, content });
}
