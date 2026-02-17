import { api } from '@/lib/axios';
import type { Group } from '@/types';

export const groupService = {
  async list(): Promise<Group[]> {
    const { data } = await api.get<Group[]>('/groups');
    return data;
  },

  async create(name: string): Promise<Group> {
    const { data } = await api.post<Group>('/groups', { name });
    return data;
  },

  async addMember(groupId: string, userId: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(`/groups/${groupId}/members`, { userId });
    return data;
  },
};
