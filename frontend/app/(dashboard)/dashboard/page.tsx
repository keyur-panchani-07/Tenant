'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { groupService } from '@/services/group.service';
import { messageService } from '@/services/message.service';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGroupSchema, addMemberSchema } from '@/lib/validations/groups';
import type { CreateGroupInput, AddMemberInput } from '@/lib/validations/groups';
import type { Group, Message, ReceiveMessagePayload } from '@/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, isAdmin, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleReceiveMessage = useCallback((payload: ReceiveMessagePayload) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === payload.id)) return prev;
      return [...prev, { ...payload, user: payload.sender }];
    });
  }, []);

  useSocket({
    groupId: activeGroupId,
    onMessage: handleReceiveMessage,
    onError: (msg) => toast.error(msg),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingGroups(true);
      try {
        const list = await groupService.list();
        if (!cancelled) setGroups(list);
      } catch {
        // handled by axios
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    messageService.getMessages(activeGroupId).then((list) => {
      if (!cancelled) {
        setMessages(list);
        setLoadingMessages(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingMessages(false);
    });
    return () => { cancelled = true; };
  }, [activeGroupId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeGroupId) return;
    try {
      await messageService.sendMessage(activeGroupId, content);
      // Message will appear via socket receive_message
    } catch {
      // handled by axios
    }
  }, [activeGroupId]);

  const openAddMember = (groupId: string) => {
    setAddMemberGroupId(groupId);
    setAddMemberModalOpen(true);
  };

  const handleCreateGroup = async (data: CreateGroupInput) => {
    if (!user?.id) return;
    try {
      const group = await groupService.create(data.name);
      await groupService.addMember(group.id, user.id);
      setGroups((prev) => [...prev, group]);
      setCreateModalOpen(false);
      toast.success(`Channel "${group.name}" created`);
    } catch {
      // handled by axios
    }
  };

  const handleAddMember = async (data: AddMemberInput) => {
    if (!addMemberGroupId) return;
    try {
      await groupService.addMember(addMemberGroupId, data.userId);
      setAddMemberModalOpen(false);
      setAddMemberGroupId(null);
      toast.success('Member added');
    } catch {
      // handled by axios
    }
  };

  const createForm = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' },
  });

  const addMemberForm = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: '' },
  });

  if (loadingGroups) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      <Sidebar
        groups={groups}
        activeGroupId={activeGroupId}
        onSelectGroup={setActiveGroupId}
        onCreateGroup={() => setCreateModalOpen(true)}
        onAddMember={openAddMember}
        isAdmin={isAdmin}
        userEmail={user?.email ?? null}
        onSignOut={signOut}
      />
      <ChatWindow
        groupName={activeGroup?.name ?? null}
        groupId={activeGroupId}
        messages={messages}
        currentUserId={user?.id ?? null}
        onSendMessage={handleSendMessage}
        isLoading={loadingMessages && messages.length === 0}
        loadMore={null}
        loadingMore={false}
      />

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          createForm.reset({ name: '' });
        }}
        title="Create channel"
      >
        <form onSubmit={createForm.handleSubmit(handleCreateGroup)} className="space-y-4">
          <Input
            label="Channel name"
            placeholder="e.g. general"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createForm.formState.isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => {
          setAddMemberModalOpen(false);
          setAddMemberGroupId(null);
          addMemberForm.reset();
        }}
        title="Add member"
      >
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
          Enter the user ID (from your organization) to add to this channel.
        </p>
        <form onSubmit={addMemberForm.handleSubmit(handleAddMember)} className="space-y-4">
          <Input
            label="User ID"
            placeholder="cuid..."
            error={addMemberForm.formState.errors.userId?.message}
            {...addMemberForm.register('userId')}
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddMemberModalOpen(false);
                setAddMemberGroupId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addMemberForm.formState.isSubmitting}>
              Add
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
