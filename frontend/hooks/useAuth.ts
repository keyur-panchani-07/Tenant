'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const { token, user, orgId, setAuth, logout, hydrate, getPayload } = useAuthStore();
  const router = useRouter();
  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  const signOut = useCallback(() => {
    logout();
    router.push('/login');
  }, [logout, router]);

  return {
    token,
    user,
    orgId,
    isAuthenticated,
    setAuth,
    signOut,
    getPayload,
    isAdmin: getPayload()?.role === 'ADMIN',
  };
}
