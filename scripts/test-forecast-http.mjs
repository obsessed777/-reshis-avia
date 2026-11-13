import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.env.FORECAST_TEST_URL ?? 'http://127.0.0.1:3000';
const source = readFileSync(new URL('../data/my_forecast.csv', import.meta.url), 'utf8').trim().split(/\r?\n/).map(line => line.split(','));
const header = source.shift();
const column = name => { const index = header.indexOf(name); assert.notEqual(index, -1); return index; };
const qs = Array.from({ length: 9 }, (_, i) => (i + 1) / 10);
const routesResponse = await fetch(`${base}/api/routes`);
assert.equal(routesResponse.status, 200);
const metadata = await routesResponse.json();
assert.equal(metadata.routes.length, 5);
assert.equal(source.length, 155);
const post = (body, headers = { 'Content-Type': 'application/json' }) => fetch(`${base}/api/forecast`, { method: 'POST', headers, body });
const jsonPost = body => post(JSON.stringify(body));
for (const row of source) {
  const route = metadata.routes.find(item => item.route === row[column('route')]);
  assert.ok(route);
  const request = { origin: route.origin, destination: route.destination, date: row[column('date')], price: route.basePrice };
  const response = await jsonPost(request);
  assert.equal(response.status, 200, `${route.route} ${request.date}`);
  const forecast = await response.json();
  assert.equal(forecast.route, route.route);
  assert.equal(forecast.date, request.date);
  assert.equal(forecast.price, request.price);
  assert.equal(forecast.dataVersion, metadata.dataVersion);
  assert.equal(forecast.seats, Number(row[column('seats')]));
  assert.equal(forecast.quantiles.length, 9);
  qs.forEach((q, i) => { assert.equal(forecast.quantiles[i].quantile, q); assert.equal(forecast.quantiles[i].demand, Number(row[column(`${q}_base_demand`)])); });
  assert.equal(forecast.demand, forecast.quantiles[4].demand);
  assert.equal(forecast.sales, Math.min(forecast.seats, Math.max(0, forecast.demand)));
  assert.equal(forecast.freeSeats, forecast.seats - forecast.sales);
}
const request = { origin: 'MOW', destination: 'AER', date: '2026-06-01', price: 9000 };
for (const [price, expectedDemand, expectedSales] of [[0.01, 2113.99859, 900], [10000, 704, 704], [100000, -11986, 0]]) {
  const response = await jsonPost({ ...request, price });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(Math.abs(result.demand - expectedDemand) < 1e-8);
  assert.equal(result.sales, expectedSales);
  assert.equal(result.freeSeats, 900 - expectedSales);
  for (let i = 0; i < 9; i++) assert.ok(Math.abs(result.quantiles[i].demand - (Number(source[0][column(`${qs[i]}_base_demand`)]) - 0.141 * (price - 9000))) < 1e-8);
}
const checks = [
  [await post('{'), 400, 'INVALID_JSON'],
  [await jsonPost({ ...request, price: -1 }), 422, 'INVALID_FIELDS'],
  [await jsonPost({ ...request, price: 1.001 }), 422, 'INVALID_FIELDS'],
  [await post('{"origin":"MOW","destination":"AER","date":"2026-06-01","price":1e309}'), 422, 'INVALID_FIELDS'],
  [await jsonPost({ ...request, date: '2026-02-30' }), 422, 'INVALID_FIELDS'],
  [await jsonPost({ ...request, date: '2026-07-02' }), 404, 'FLIGHT_NOT_FOUND'],
  [await jsonPost({ ...request, destination: 'XXX' }), 404, 'FLIGHT_NOT_FOUND'],
  [await post(' '.repeat(4097)), 413, 'BODY_TOO_LARGE'],
];
for (const [response, status, code] of checks) { assert.equal(response.status, status); assert.equal((await response.json()).error.code, code); }
console.log('HTTP forecast checks passed: 155 route/date snapshots, 9 quantiles each, price boundaries and 8 error cases.');
