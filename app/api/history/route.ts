import { NextRequest } from 'next/server';
import { allowedOrigin, response } from '@/lib/server/auth/core';
import { historyBody, historyItem, historySession } from '@/lib/server/history';
import { validateRequest } from '@/lib/server/forecast/core';
import { getForecast } from '@/lib/server/forecast';

export async function GET(request: NextRequest) {
  try {
    const session = await historySession(request);
    if (session instanceof Response) return session;
    const { auth, user } = session;
    const offsetText = request.nextUrl.searchParams.get('offset') ?? '0';
    if (!/^\d{1,7}$/.test(offsetText) || Number(offsetText) > 1000000) return auth.apply(response({ error: { code: 'INVALID_FIELDS' } }, 422));
    const offset = Number(offsetText);
    const { data, error } = await auth.client.from('forecast_history').select('id,created_at,snapshot')
      .eq('user_id', user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 20);
    if (error) return auth.apply(response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503));
    return auth.apply(response({ items: (data ?? []).slice(0, 20).map(historyItem), hasMore: (data?.length ?? 0) > 20, nextOffset: offset + 20 }, 200));
  } catch { return response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503); }
}

export async function POST(request: NextRequest) {
  if (!allowedOrigin(request)) return response({ error: { code: 'FORBIDDEN' } }, 403);
  try {
    const session = await historySession(request);
    if (session instanceof Response) return session;
    const { auth, user } = session;
    let body: unknown;
    try { body = await historyBody(request); }
    catch (error) { return auth.apply(response({ error: { code: error instanceof RangeError ? 'BODY_TOO_LARGE' : 'INVALID_JSON' } }, error instanceof RangeError ? 413 : 400)); }
    const validated = validateRequest(body);
    if (!validated.request) return auth.apply(response({ error: { code: 'INVALID_FIELDS', fields: validated.fields } }, 422));
    // Only canonical server calculations enter history. Client-supplied results and owner IDs are ignored.
    const forecast = getForecast(validated.request);
    if (!forecast) return auth.apply(response({ error: { code: 'FLIGHT_NOT_FOUND' } }, 404));
    const { data, error } = await auth.client.from('forecast_history').insert({ user_id: user.id, snapshot: forecast }).select('id,created_at,snapshot').single();
    if (error || !data) return auth.apply(response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503));
    return auth.apply(response(historyItem(data), 201));
  } catch { return response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503); }
}
