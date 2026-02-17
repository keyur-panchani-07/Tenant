'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await authService.login(data.email, data.password);
      setAuth(res.token, { ...res.user, orgId: res.user.orgId });
      toast.success('Signed in successfully');
      router.replace('/dashboard');
    } catch {
      // Error already handled by axios interceptor
    }
  };

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-900">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an org?{' '}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Register as org admin
        </Link>
      </p>
    </div>
  );
}
