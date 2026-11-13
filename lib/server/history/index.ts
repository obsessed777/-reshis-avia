import 'server-only';
import type { Forecast } from '@/lib/contracts/forecast';
import type { HistoryItem } from '@/lib/contracts/history';
import { createAuth, errorResponse, response } from '@/lib/server/auth/core';
import type { NextRequest } from 'next/server';

export async function historySession(request: NextRequest) {
  const auth = createAuth(request);
  if (!auth) return response({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503);
  const { data, error } = await auth.client.auth.getUser();
  if (error || !data.user) {
    const status = error ? errorResponse(error, 'me').status : 401;
    if (status === 401) auth.clear();
    return auth.apply(response({ error: { code: status === 401 ? 'UNAUTHENTICATED' : 'HISTORY_UNAVAILABLE' } }, status));
  }
  return { auth, user: data.user };
}

export function historyItem(row: { id: string; created_at: string; snapshot: unknown }): HistoryItem {
  const value = row.snapshot as Forecast | null;
  const numbers = value ? [value.price, value.seats, value.demand, value.sales, value.freeSeats] : [];
  if (!value || typeof value.route !== 'string' || !/^MOW-(AER|KGD|LED|MRV|OVB)$/.test(value.route)
    || typeof value.date !== 'string' || !/^2026-(06-\d{2}|07-01)$/.test(value.date)
    || !Number.isFinite(Date.parse(`${value.date}T00:00:00Z`)) || new Date(`${value.date}T00:00:00Z`).toISOString().slice(0, 10) !== value.date
    || value.date < '2026-06-01' || value.date > '2026-07-01' || typeof value.dataVersion !== 'string'
    || numbers.length !== 5 || numbers.some(n => typeof n !== 'number' || !Number.isFinite(n))
    || !Array.isArray(value.quantiles) || value.quantiles.length !== 9
    || value.quantiles.some((p, i) => !p || p.quantile !== (i + 1) / 10 || !Number.isFinite(p.demand))
    || value.quantiles[4].demand !== value.demand || value.seats <= 0 || value.price <= 0
    || value.sales !== Math.min(value.seats, Math.max(0, value.demand)) || value.freeSeats !== value.seats - value.sales) {
    throw new Error('Invalid stored forecast');
  }
  return { id: row.id, createdAt: row.created_at, forecast: value };
}

export async function historyBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > 4096) throw new RangeError('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('INVALID_JSON');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new RangeError('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
