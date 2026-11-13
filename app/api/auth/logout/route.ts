import { NextRequest } from 'next/server';
import { allowedOrigin, createAuth, empty, response } from '@/lib/server/auth/core';

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return response({ error: 'forbidden' }, 403);
  try {
    const auth = createAuth(request);
    if (!auth) return response({ error: 'unavailable' }, 503);
    try {
      const { error } = await auth.client.auth.signOut({ scope: 'local' });
      auth.clear();
      if (error && error.status !== 400 && error.status !== 401 && error.status !== 403) return auth.apply(response({ error: 'logout_unavailable', localCleared: true }, 503));
      return auth.apply(empty(204));
    } catch { auth.clear(); return auth.apply(response({ error: 'logout_unavailable', localCleared: true }, 503)); }
  } catch { return response({ error: 'unavailable' }, 503); }
}
