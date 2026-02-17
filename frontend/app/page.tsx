'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
    else router.replace('/login');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}
