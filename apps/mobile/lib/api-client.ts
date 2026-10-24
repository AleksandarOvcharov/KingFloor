import { supabase } from './supabase';

// Same deployed Next.js app the website runs on — apps/mobile doesn't have
// its own backend, it calls apps/web's /api/* routes directly. Mirrors
// apps/web/lib/api/client.ts's getAuthHeaders(), just reading the session
// from the native Supabase client (secure-store backed) instead of the
// browser one.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });
}
