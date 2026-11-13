import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate, metadata, validateRequest } from '../lib/server/forecast/core.ts';

const data = JSON.parse(readFileSync(new URL('../lib/server/forecast/data.json', import.meta.url)));
const csv = readFileSync(new URL('../data/my_forecast.csv', import.meta.url), 'utf8').trim().split(/\r?\n/).map(line => line.split(','));
const headers = csv.shift();
const medianIndex = headers.indexOf('0.5_base_demand');
test('all source route/date pairs and endpoints use the CSV median at base price', () => {
  const info = metadata(data);
  assert.equal(info.routes.length, 5);
  assert.equal(csv.length, 155);
  for (const row of csv) {
    const route = info.routes.find(r => r.route === row[0]);
    assert.ok(route);
    const result = calculate(data, { origin: route.origin, destination: route.destination, date: row[1], price: route.basePrice });
    assert.ok(result);
    assert.equal(result.demand, Number(row[medianIndex]));
    assert.equal(result.quantiles.length, 9);
    assert.equal(result.quantiles[4].demand, result.demand);
  }
  for (const route of info.routes) { assert.equal(route.dates.length, 31); assert.equal(route.dates[0], '2026-06-01'); assert.equal(route.dates.at(-1), '2026-07-01'); }
});
test('known AER row, price direction, bounds and unbounded quantiles', () => {
  const request = { origin: 'MOW', destination: 'AER', date: '2026-06-01', price: 9000 };
  const base = calculate(data, request);
  assert.equal(base.demand, 845);
  assert.equal(base.seats, 900);
  assert.equal(base.quantiles[0].demand, 759);
  assert.equal(calculate(data, { ...request, price: 10000 }).demand, 704);
  const low = calculate(data, { ...request, price: 0.01 });
  assert.equal(low.sales, 900);
  assert.equal(low.freeSeats, 0);
  const high = calculate(data, { ...request, price: 100000 });
  assert.ok(high.demand < 0);
  assert.ok(high.quantiles[0].demand < 0);
  assert.equal(high.sales, 0);
  assert.equal(high.freeSeats, 900);
  assert.equal(calculate(data, { ...request, date: '2026-07-02' }), null);
  assert.equal(calculate(data, { ...request, destination: 'XXX' }), null);
});
test('validation rejects nonfinite, malformed and excessive precision without treating advisory bounds as restrictions', () => {
  const good = { origin: 'MOW', destination: 'AER', date: '2026-06-01', price: 100000 };
  assert.ok(validateRequest(good).request);
  for (const price of [NaN, Infinity, 0, -1, 0.001, 0.010000000001, 90071992547410, '9000']) assert.ok(validateRequest({ ...good, price }).fields?.price);
  for (const date of ['2026-02-30', '2026-13-01', '2026-6-01', '']) assert.ok(validateRequest({ ...good, date }).fields?.date);
  assert.ok(validateRequest({ ...good, origin: 'Mow' }).fields?.origin);
  assert.ok(validateRequest(null).fields);
});
