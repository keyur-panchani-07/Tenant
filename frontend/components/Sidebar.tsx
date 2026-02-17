'use client';

import type { Group } from '@/types';

type SidebarProps = {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  onAddMember: (groupId: string) => void;
  isAdmin: boolean;
  userEmail: string | null;
  onSignOut: () => void;
};

export function Sidebar({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onAddMember,
  isAdmin,
  userEmail,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Channels</span>
        {isAdmin && (
          <button
            type="button"
            onClick={onCreateGroup}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            title="Create channel"
            aria-label="Create channel"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Channels">
        {groups.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No channels yet. {isAdmin ? 'Create one above.' : 'Ask your admin to add you.'}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {groups.map((g) => (
              <li key={g.id}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectGroup(g.id)}
                    className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeGroupId === g.id
                        ? 'bg-emerald-100 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <HashtagIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{g.name}</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onAddMember(g.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      title="Add member"
                      aria-label={`Add member to ${g.name}`}
                    >
                      <UserPlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="border-t border-slate-200 p-2 dark:border-slate-700">
        <p className="truncate px-2 text-xs text-slate-500 dark:text-slate-400" title={userEmail ?? ''}>
          {userEmail ?? '—'}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function HashtagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}
