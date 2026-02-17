'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  getSocket,
  disconnectSocket,
  joinGroup as joinGroupEmit,
  sendMessageSocket as sendMessageEmit,
} from '@/services/socket.service';
import type { ReceiveMessagePayload } from '@/types';

type UseSocketOptions = {
  groupId: string | null;
  onMessage?: (payload: ReceiveMessagePayload) => void;
  onJoined?: (groupId: string) => void;
  onError?: (message: string) => void;
};

/** Manage socket connection and group room. Join only when groupId matches; listen for receive_message. */
export function useSocket({ groupId, onMessage, onJoined, onError }: UseSocketOptions) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<ReturnType<typeof getSocket>>(null);
  const currentGroupRef = useRef<string | null>(null);

  useEffect(() => {
    const s = getSocket(token);
    socketRef.current = s;
    if (!s) return;

    s.on('receive_message', (payload: ReceiveMessagePayload) => {
      onMessage?.(payload);
    });
    s.on('joined_group', ({ groupId: gId }: { groupId: string }) => {
      onJoined?.(gId);
    });
    s.on('error', ({ message }: { message: string }) => {
      onError?.(message);
    });

    return () => {
      s.off('receive_message');
      s.off('joined_group');
      s.off('error');
    };
  }, [token, onMessage, onJoined, onError]);

  useEffect(() => {
    if (!socketRef.current?.connected || !groupId) {
      currentGroupRef.current = null;
      return;
    }
    // Leave previous room implicitly by joining new one; backend only allows user's groups.
    currentGroupRef.current = groupId;
    joinGroupEmit(socketRef.current, groupId);
  }, [groupId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!groupId || !socketRef.current) return;
      sendMessageEmit(socketRef.current, groupId, content);
    },
    [groupId]
  );

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return { sendMessage, socket: socketRef.current };
}
