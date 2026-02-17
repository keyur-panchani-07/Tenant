'use client';

import type { Message } from '@/types';

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const sender = message.user ?? message.sender;
  const displayName = sender?.email?.split('@')[0] ?? 'Unknown';

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-emerald-600 text-white rounded-br-md'
            : 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 rounded-bl-md'
        }`}
      >
        {!isOwn && (
          <p className="mb-0.5 text-xs font-medium opacity-90">{displayName}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        <p className={`mt-1 text-xs ${isOwn ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
