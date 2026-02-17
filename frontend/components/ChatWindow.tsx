'use client';

import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendMessageSchema, type SendMessageInput } from '@/lib/validations/messages';
import { MessageBubble } from './MessageBubble';
import { Button } from './ui/Button';
import type { Message } from '@/types';

type ChatWindowProps = {
  groupName: string | null;
  groupId: string | null;
  messages: Message[];
  currentUserId: string | null;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  loadMore: (() => void) | null;
  loadingMore: boolean;
};

export function ChatWindow({
  groupName,
  groupId,
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
  loadMore,
  loadingMore,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SendMessageInput>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const onSubmit = (data: SendMessageInput) => {
    onSendMessage(data.content);
    reset();
  };

  if (!groupId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50">
        <p className="text-slate-500 dark:text-slate-400">Select a channel to start messaging.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-100 dark:bg-slate-800/50">
      <header className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-700">
        <h1 className="font-semibold text-slate-800 dark:text-slate-200"># {groupName ?? 'Channel'}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loadMore && (
          <div className="flex justify-center py-2">
            <Button variant="ghost" size="sm" onClick={loadMore} loading={loadingMore}>
              Load older messages
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user?.id === currentUserId || msg.sender?.id === currentUserId}
              />
            ))
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex gap-2 border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      >
        <input
          {...register('content')}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          autoComplete="off"
        />
        <Button type="submit" size="md">Send</Button>
        {errors.content && (
          <p className="absolute mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </form>
    </div>
  );
}
