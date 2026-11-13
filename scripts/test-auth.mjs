import assert from 'node:assert/strict';

// Run against a local server with APP_ORIGIN set to this URL. No accounts are created.
const base = process.env.AUTH_TEST_ORIGIN || 'http://127.0.0.1:3000';
async function check(path, options, status, code) {
  const result = await fetch(base + path, options);
  assert.equal(result.status, status, path);
  assert.match(result.headers.get('cache-control') || '', /no-store/);
  if (code) assert.equal((await result.json()).error, code);
}
const json = (body, origin = base) => ({ method: 'POST', headers: { origin, 'content-type': 'application/json' }, body });
await check('/api/auth/login', json('{}', 'https://foreign.example'), 403, 'forbidden');
await check('/api/auth/logout', { method: 'POST' }, 403, 'forbidden');
await check('/api/auth/register', json('{'), 400, 'bad_request');
await check('/api/auth/login', json('{}'), 422, 'invalid_input');
await check('/api/auth/login', json('x'.repeat(4100)), 413, 'too_large');
await check('/api/auth/me', {}, 401, 'unauthenticated');
await check('/api/auth/logout', { method: 'POST', headers: { origin: base } }, 204);
console.log('Auth request validation passed');
