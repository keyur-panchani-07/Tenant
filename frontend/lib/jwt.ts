/**
 * Decode JWT payload without verification (client-side). Verification is done by the API.
 * Used to read userId, orgId, role for tenant isolation and route protection.
 */
export function decodeJwtPayload<T = { userId?: string; orgId?: string; role?: string }>(token: string): T | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
