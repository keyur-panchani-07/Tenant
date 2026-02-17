import { api } from '@/lib/axios';
import type { Message } from '@/types';

export const messageService = {
  async getMessages(groupId: string, limit = 50): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/groups/${groupId}/messages`, {
      params: { limit: Math.min(limit, 100) },
    });
    return data;
  },

  async sendMessage(groupId: string, content: string): Promise<Message> {
    const { data } = await api.post<Message>(`/groups/${groupId}/messages`, { content });
    return data;
  },
};
