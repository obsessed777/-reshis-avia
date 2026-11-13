import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// The supplied CSVs contain plain, unquoted fields. Reject ambiguous input.
function readCsv(path, required) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').trim();
  if (text.includes('"')) throw new Error(`${path}: quoted CSV fields are unsupported`);
  const [header, ...lines] = text.split(/\r?\n/).map(line => line.split(','));
  if (new Set(header).size !== header.length || required.some(key => !header.includes(key))) throw new Error(`${path}: invalid columns`);
  return lines.map((line, i) => {
    if (line.length !== header.length) throw new Error(`${path}: invalid row ${i + 2}`);
    return Object.fromEntries(header.map((key, j) => [key, line[j]]));
  });
}
const numeric = (value, label) => {
  if (value === '' || !Number.isFinite(Number(value))) throw new Error(`Invalid ${label}`);
  return Number(value);
};
const qs = Array.from({ length: 9 }, (_, i) => (i + 1) / 10);
const names = ['MOW-AER', 'MOW-KGD', 'MOW-LED', 'MOW-MRV', 'MOW-OVB'];
const routeRows = readCsv('data/routes.csv', ['route', 'base_price', 'price_sensitivity', 'price_min', 'price_max']);
const routes = routeRows.map(row => ({ route: row.route, basePrice: numeric(row.base_price, 'base price'), sensitivity: numeric(row.price_sensitivity, 'sensitivity'), priceMin: numeric(row.price_min, 'minimum price'), priceMax: numeric(row.price_max, 'maximum price') }));
if (routes.length !== names.length || new Set(routes.map(r => r.route)).size !== names.length || names.some(name => !routes.some(r => r.route === name)) || routes.some(r => r.basePrice <= 0 || r.sensitivity < 0 || r.priceMin <= 0 || r.priceMax < r.priceMin)) throw new Error('Invalid route metadata');
routes.sort((a, b) => a.route.localeCompare(b.route, 'en'));
const rows = readCsv('data/my_forecast.csv', ['route', 'date', 'seats', ...qs.map(q => `${q}_base_demand`)]);
const keys = new Set();
const forecasts = rows.map(row => {
  const key = `${row.route}/${row.date}`;
  if (keys.has(key)) throw new Error(`Duplicate ${key}`);
  keys.add(key);
  const seats = numeric(row.seats, 'seats');
  const quantiles = qs.map(q => numeric(row[`${q}_base_demand`], 'quantile'));
  if (!names.includes(row.route) || !Number.isInteger(seats) || seats <= 0 || quantiles.some((n, i) => i > 0 && n < quantiles[i - 1])) throw new Error(`Invalid forecast ${key}`);
  return { route: row.route, date: row.date, seats, quantiles };
});
for (const name of names) for (let i = 0; i < 31; i++) {
  const date = new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10);
  if (!keys.has(`${name}/${date}`)) throw new Error(`Missing ${name}/${date}`);
}
if (forecasts.length !== 155) throw new Error('Unexpected forecast coverage');
forecasts.sort((a, b) => `${a.route}/${a.date}`.localeCompare(`${b.route}/${b.date}`, 'en'));
const content = JSON.stringify({ routes, forecasts });
const dataVersion = `sha256-${createHash('sha256').update(content).digest('hex').slice(0, 16)}`;
writeFileSync('lib/server/forecast/data.json', `${JSON.stringify({ dataVersion, routes, forecasts })}\n`);
console.log(`Validated ${forecasts.length} forecasts, ${dataVersion}`);
