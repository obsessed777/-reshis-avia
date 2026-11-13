import { NextRequest } from 'next/server';
import { allowedOrigin, createAuth, credentials, errorResponse, publicUser, response } from '@/lib/server/auth/core';

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return response({ error: 'forbidden' }, 403);
  const input = await credentials(request);
  if (input instanceof Response) return input;
  try {
    const auth = createAuth(request);
    if (!auth) return response({ error: 'unavailable' }, 503);
    const { data, error } = await auth.client.auth.signUp(input);
    if (error) return auth.apply(errorResponse(error, 'register'));
    const user = publicUser(data.user);
    if (!data.session || !user) return auth.apply(response({ error: 'confirmation_enabled' }, 503));
    return auth.apply(response({ user }, 201));
  } catch { return response({ error: 'unavailable' }, 503); }
}
