import type { Session } from '@supabase/supabase-js';

/**
 * Base URL for the Oalethia API (e.g. your Node/Express server).
 * Set EXPO_PUBLIC_API_URL in .env or app.config.js.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://your-api.example.com';

/**
 * Returns headers for authenticated API requests.
 * Use for all API calls that require auth: Authorization: Bearer <session.access_token>.
 */
export function getAuthHeaders(session: Session | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Convenience fetch wrapper: GET with auth headers.
 */
export async function apiGet(
  path: string,
  session: Session | null
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(session),
  });
}

/**
 * Convenience fetch wrapper: POST with auth headers and optional JSON body.
 */
export async function apiPost(
  path: string,
  session: Session | null,
  body?: object
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(session),
    body: body ? JSON.stringify(body) : undefined,
  });
}
