'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '@/lib/axios';
import { decodeJwtPayload } from '@/lib/jwt';
import type { JwtPayload, User } from '@/types';

const TOKEN_KEY = 'auth_token';

type AuthState = {
  token: string | null;
  user: User | null;
  orgId: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
  getPayload: () => JwtPayload | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      orgId: null,

      setAuth(token: string, user: User) {
        setAuthToken(token);
        const payload = decodeJwtPayload<JwtPayload>(token);
        set({
          token,
          user,
          orgId: payload?.orgId ?? user.orgId ?? null,
        });
      },

      logout() {
        setAuthToken(null);
        set({ token: null, user: null, orgId: null });
      },

      hydrate() {
        const { token } = get();
        if (token) setAuthToken(token);
      },

      getPayload(): JwtPayload | null {
        const { token } = get();
        return token ? decodeJwtPayload<JwtPayload>(token) : null;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user, orgId: s.orgId }),
    }
  )
);
