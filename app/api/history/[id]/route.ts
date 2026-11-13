import { NextRequest } from 'next/server';
import { response } from '@/lib/server/auth/core';
import { historyItem, historySession } from '@/lib/server/history';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await historySession(request);
    if (session instanceof Response) return session;
    const { auth, user } = session;
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return auth.apply(response({ error: { code: 'NOT_FOUND' } }, 404));
    const { data, error } = await auth.client.from('forecast_history').select('id,created_at,snapshot').eq('user_id', user.id).eq('id', id).maybeSingle();
    if (error) return auth.apply(response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503));
    if (!data) return auth.apply(response({ error: { code: 'NOT_FOUND' } }, 404));
    return auth.apply(response(historyItem(data), 200));
  } catch { return response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503); }
}
