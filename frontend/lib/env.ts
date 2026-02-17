/**
 * Env validation for client-side usage. Next.js only exposes NEXT_PUBLIC_* to the browser.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';

if (typeof window !== 'undefined' && !API_URL) {
  console.warn('NEXT_PUBLIC_API_URL is not set. API calls may fail.');
}

export const env = {
  apiUrl: API_URL.replace(/\/$/, ''),
  socketUrl: SOCKET_URL.replace(/\/$/, ''),
} as const;
