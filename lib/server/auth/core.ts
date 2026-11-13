import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import 'server-only';

export type AuthUser = { id: string; email: string };
type CookieWrite = { name: string; value: string; options: Parameters<NextResponse['cookies']['set']>[2] };
const headers = { 'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0', 'Vary': 'Cookie', 'Pragma': 'no-cache', 'Expires': '0' };

export function response(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers });
}
export function empty(status: number) { return new NextResponse(null, { status, headers }); }
export function allowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const actual = new URL(request.url).origin;
    const configured = process.env.APP_ORIGIN;
    if (!origin) return false;
    if (!configured) return origin === actual;
    const expected = new URL(configured);
    if (origin !== expected.origin) return false;
    if (actual === expected.origin) return true;
    // Next's development server rewrites 127.0.0.1 to localhost in request.url.
    const received = new URL(actual);
    const loopback = (host: string) => host === 'localhost' || host === '127.0.0.1';
    return loopback(expected.hostname) && loopback(received.hostname) && expected.protocol === received.protocol && expected.port === received.port && request.headers.get('host') === expected.host;
  } catch { return false; }
}
export async function credentials(request: NextRequest): Promise<{ email: string; password: string } | NextResponse> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 4096) return response({ error: 'too_large' }, 413);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return response({ error: 'bad_request' }, 400);
  let raw: Uint8Array;
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: 'bad_request' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) { await reader.cancel(); return response({ error: 'too_large' }, 413); }
      chunks.push(value);
    }
    raw = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.length; }
  } catch { return response({ error: 'bad_request' }, 400); }
  let data: unknown;
  try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); }
  catch { return response({ error: 'bad_request' }, 400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return response({ error: 'invalid_input' }, 422);
  const { email, password } = data as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8 || password.length > 1024)
    return response({ error: 'invalid_input' }, 422);
  return { email: email.trim(), password };
}
export function createAuth(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  let cookiePrefix: string;
  try { cookiePrefix = 'sb-' + new URL(url).hostname.split('.')[0] + '-auth-token'; }
  catch { return null; }
  const writes: CookieWrite[] = [];
  const secure = new URL(request.url).protocol === 'https:';
  const client = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure, sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookies => { for (const cookie of cookies) writes.push({ ...cookie, options: { ...cookie.options, httpOnly: true, secure, sameSite: 'lax', path: '/', domain: undefined } }); },
    },
  });
  function clear() {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name === cookiePrefix || cookie.name.startsWith(cookiePrefix + '.') || cookie.name === cookiePrefix + '-code-verifier' || cookie.name.startsWith(cookiePrefix + '-code-verifier.')) writes.push({ name: cookie.name, value: '', options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 0 } });
    }
  }
  function apply(result: NextResponse) { for (const { name, value, options } of writes) result.cookies.set(name, value, options); return result; }
  return { client, clear, apply };
}
export function errorResponse(error: { status?: number; code?: string }, action: 'login' | 'register' | 'me') {
  if (error.status === 429) return response({ error: 'rate_limit' }, 429);
  if (action === 'login' && (error.status === 400 || error.status === 401)) return response({ error: 'invalid_credentials' }, 401);
  if (action === 'register' && (error.code === 'user_already_exists' || error.code === 'email_exists')) return response({ error: 'account_exists' }, 409);
  if (action === 'register' && (error.status === 422 || error.code === 'weak_password' || error.code === 'email_address_invalid')) return response({ error: 'invalid_input' }, 422);
  if (action === 'me' && (error.status === 400 || error.status === 401 || error.status === 403)) return response({ error: 'unauthenticated' }, 401);
  return response({ error: 'unavailable' }, 503);
}
export function publicUser(user: { id: string; email?: string } | null): AuthUser | null {
  return user?.email ? { id: user.id, email: user.email } : null;
}
