'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/** Protect dashboard routes: require auth and tenant context. Prevents cross-org access at UI level. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, orgId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!orgId) {
      // Token might be stale; logout and redirect
      router.replace('/login');
    }
  }, [isAuthenticated, orgId, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
