import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

// Uses synthetic accounts only. Passwords, session cookies and tokens stay in memory.
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const origin = process.env.HISTORY_TEST_URL || 'http://127.0.0.1:3000';
const secondOrigin = process.env.HISTORY_SECOND_URL || origin;
const provider = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
assert.ok(provider && key, 'Supabase configuration is required for direct RLS checks');
const request = { origin: 'MOW', destination: 'AER', date: '2026-06-01', price: 9000 };

function account(target = origin) { return { target, jar: new Map(), email: `qa-history-${randomUUID()}@example.com`, password: `${randomBytes(24).toString('base64url')}aA1!` }; }
async function api(user, path, method = 'GET', body, foreignOrigin) {
  const headers = { origin: foreignOrigin || user.target };
  if (user.jar.size) headers.cookie = [...user.jar].map(([name, value]) => `${name}=${value}`).join('; ');
  if (body !== undefined) headers['content-type'] = 'application/json';
  const result = await fetch(user.target + path, { method, headers, redirect: 'manual', body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
  for (const cookie of result.headers.getSetCookie()) {
    const pair = cookie.split(';', 1)[0]; const separator = pair.indexOf('=');
    if (/max-age=0(?:;|$)/i.test(cookie)) user.jar.delete(pair.slice(0, separator));
    else user.jar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  assert.match(result.headers.get('cache-control') || '', /no-store/i, 'Private response must not be cached');
  return { status: result.status, data: result.status === 204 ? null : await result.json() };
}
function token(user) {
  const packed = [...user.jar].filter(([name]) => /-auth-token(?:\.\d+)?$/.test(name)).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })).map(([, value]) => value).join('');
  return JSON.parse(Buffer.from(packed.slice(7), 'base64url').toString()).access_token;
}
async function rest(user, path, method = 'GET', body) {
  const headers = { apikey: key, 'content-type': 'application/json' };
  if (user) headers.authorization = 'Bearer ' + token(user);
  const result = await fetch(provider + '/rest/v1/forecast_history' + path, { method, headers, body: body && JSON.stringify(body), redirect: 'manual' });
  return { status: result.status, data: await result.json().catch(() => null) };
}
async function main() {
  const anon = account(); const a = account(); const b = account();
  assert.equal((await api(anon, '/api/history')).status, 401);
  assert.equal((await api(anon, '/api/history', 'POST', request)).status, 401);
  assert.equal((await api(anon, '/api/history', 'POST', request, 'https://foreign.example')).status, 403);
  for (const user of [a, b]) {
    const registered = await api(user, '/api/auth/register', 'POST', { email: user.email, password: user.password });
    assert.equal(registered.status, 201, 'Register synthetic account'); user.id = registered.data.user.id;
  }
  assert.equal((await api(a, '/api/history')).data.items.length, 0, 'New account starts empty');
  for (const [body, status] of [['{', 400], ['x'.repeat(4100), 413], [{ ...request, price: -1 }, 422], [{ ...request, date: '2026-07-02' }, 404]]) {
    assert.equal((await api(a, '/api/history', 'POST', body)).status, status, 'Invalid save must fail');
  }
  assert.equal((await api(a, '/api/history?offset=-1')).status, 422);
  const saved = await api(a, '/api/history', 'POST', { ...request, user_id: b.id, sales: -500 });
  assert.equal(saved.status, 201); const item = saved.data;
  assert.equal(item.forecast.demand, 845); assert.equal(item.forecast.sales, 845); assert.equal(item.forecast.freeSeats, 55);
  assert.equal(item.forecast.quantiles.length, 9); assert.equal(item.forecast.quantiles[4].demand, item.forecast.demand);
  assert.deepEqual((await api(a, '/api/history/' + item.id)).data, item, 'Stored snapshot opens unchanged');
  assert.equal((await api(b, '/api/history/' + item.id)).status, 404, 'Foreign history item is invisible');
  assert.equal((await api(b, '/api/history')).data.items.length, 0, 'Foreign list is empty');
  assert.equal((await api(anon, '/api/history/' + item.id)).status, 401);
  assert.deepEqual((await rest(b, '?select=id&id=eq.' + item.id)).data, [], 'RLS filters foreign rows without API owner filter');
  assert.ok([401, 403].includes((await rest(null, '?select=id')).status), 'Anonymous Data API denied');
  assert.equal((await rest(b, '', 'POST', { user_id: a.id, snapshot: item.forecast })).status, 403, 'RLS rejects forged owner');
  assert.equal((await rest(a, '?id=eq.' + item.id, 'PATCH', { user_id: b.id })).status, 403, 'History is immutable to users');
  const cross = { ...a, target: secondOrigin, jar: new Map() };
  assert.equal((await api(cross, '/api/auth/login', 'POST', { email: a.email, password: a.password })).status, 200);
  assert.deepEqual((await api(cross, '/api/history/' + item.id)).data, item, 'Same snapshot is visible on second host');
  for (let i = 1; i <= 20; i++) assert.equal((await api(a, '/api/history', 'POST', { ...request, price: 9000 + i })).status, 201);
  const firstPage = await api(a, '/api/history'); const nextPage = await api(a, '/api/history?offset=20');
  assert.equal(firstPage.data.items.length, 20); assert.equal(firstPage.data.hasMore, true);
  assert.equal(nextPage.data.items.length, 1); assert.equal(nextPage.data.hasMore, false);
  assert.equal(new Set([...firstPage.data.items, ...nextPage.data.items].map(entry => entry.id)).size, 21, 'Pagination has no duplicates');
  assert.equal((await api(a, '/api/auth/logout', 'POST')).status, 204);
  assert.equal((await api(a, '/api/history')).status, 401);
  assert.equal((await api(cross, '/api/history')).data.items.length, 20, 'Other host session survives logout');
  await api(cross, '/api/auth/logout', 'POST'); await api(b, '/api/auth/logout', 'POST');
  console.log('History checks passed: canonical snapshots, 21-row pagination, cross-host persistence, anonymous/foreign isolation, direct RLS and owner forgery protection');
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : 'History test request failed'); process.exitCode = 1; });
