import axios, { AxiosError } from 'axios';
import { env } from './env';
import type { ApiError } from '@/types';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

/** Attach JWT from auth store. Call this after login with token. */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

/** Global API error handler: 401 logout, 4xx/5xx toasts. */
function handleApiError(err: unknown) {
  if (!axios.isAxiosError(err)) {
    toast.error('Something went wrong');
    return;
  }
  const axErr = err as AxiosError<ApiError>;
  const status = axErr.response?.status;
  const data = axErr.response?.data;
  const message = data?.error ?? data?.message ?? axErr.message ?? 'Request failed';

  if (status === 401) {
    // Token invalid/expired — auth store will clear and redirect to login
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    toast.error('Session expired. Please sign in again.');
    return;
  }

  if (data?.errors?.length) {
    const first = data.errors[0];
    toast.error(first?.msg ?? message);
    return;
  }

  toast.error(message);
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    handleApiError(err);
    return Promise.reject(err);
  }
);
