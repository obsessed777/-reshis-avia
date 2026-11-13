import { NextRequest } from 'next/server';
import { createAuth, errorResponse, publicUser, response } from '@/lib/server/auth/core';

export async function GET(request: NextRequest) {
  try {
    const auth = createAuth(request);
    if (!auth) return response({ error: 'unavailable' }, 503);
    const { data, error } = await auth.client.auth.getUser();
    if (error) {
      const result = errorResponse(error, 'me');
      if (result.status === 401) auth.clear();
      return auth.apply(result);
    }
    const user = publicUser(data.user);
    if (!user) { auth.clear(); return auth.apply(response({ error: 'unauthenticated' }, 401)); }
    return auth.apply(response({ user }, 200));
  } catch { return response({ error: 'unavailable' }, 503); }
}
