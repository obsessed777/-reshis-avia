import { NextRequest } from 'next/server';
import { allowedOrigin, createAuth, credentials, errorResponse, publicUser, response } from '@/lib/server/auth/core';

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return response({ error: 'forbidden' }, 403);
  const input = await credentials(request);
  if (input instanceof Response) return input;
  try {
    const auth = createAuth(request);
    if (!auth) return response({ error: 'unavailable' }, 503);
    const { data, error } = await auth.client.auth.signInWithPassword(input);
    if (error) return auth.apply(errorResponse(error, 'login'));
    const user = publicUser(data.user);
    if (!data.session || !user) return response({ error: 'unavailable' }, 503);
    return auth.apply(response({ user }, 200));
  } catch { return response({ error: 'unavailable' }, 503); }
}
