import { api } from '@/lib/axios';
import type { User, Org } from '@/types';

type LoginResponse = { token: string; user: User & { orgId?: string }; org?: Org };
type RegisterResponse = { token: string; user: User; org: Org };

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  async registerOrgAdmin(orgName: string, email: string, password: string): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register-org-admin', {
      orgName,
      email,
      password,
    });
    return data;
  },
};
