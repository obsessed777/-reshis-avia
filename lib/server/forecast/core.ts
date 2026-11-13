import type { Forecast, ForecastRequest, RoutesResponse } from '../../contracts/forecast';

type Dataset = { dataVersion: string; routes: { route: string; basePrice: number; sensitivity: number; priceMin: number; priceMax: number }[]; forecasts: { route: string; date: string; seats: number; quantiles: number[] }[] };

export function validateRequest(value: unknown): { request?: ForecastRequest; fields?: Record<string, string> } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { fields: { request: 'INVALID' } };
  const v = value as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const field of ['origin', 'destination'] as const) if (typeof v[field] !== 'string' || !/^[A-Z]{3}$/.test(v[field] as string)) fields[field] = 'INVALID';
  if (typeof v.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !Number.isFinite(Date.parse(`${v.date}T00:00:00Z`)) || new Date(`${v.date}T00:00:00Z`).toISOString().slice(0, 10) !== v.date) fields.date = 'INVALID';
  // Safe integer cents both bounds arithmetic and prevents meaningless numeric input.
  if (typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price <= 0 || !Number.isSafeInteger(Math.round(v.price * 100)) || Math.round(v.price * 100) / 100 !== v.price) fields.price = 'INVALID';
  return Object.keys(fields).length ? { fields } : { request: v as ForecastRequest };
}

export function metadata(data: Dataset): RoutesResponse {
  return { dataVersion: data.dataVersion, routes: data.routes.map(r => ({ route: r.route, origin: r.route.slice(0, 3), destination: r.route.slice(4), basePrice: r.basePrice, priceMin: r.priceMin, priceMax: r.priceMax, dates: data.forecasts.filter(f => f.route === r.route).map(f => f.date) })) };
}

export function calculate(data: Dataset, request: ForecastRequest): Forecast | null {
  const route = `${request.origin}-${request.destination}`;
  const params = data.routes.find(r => r.route === route);
  const flight = data.forecasts.find(f => f.route === route && f.date === request.date);
  if (!params || !flight) return null;
  const adjustment = params.sensitivity * (request.price - params.basePrice);
  const quantiles = flight.quantiles.map((demand, i) => ({ quantile: (i + 1) / 10, demand: demand - adjustment }));
  const demand = quantiles[4].demand;
  const sales = Math.min(flight.seats, Math.max(0, demand));
  return { route, date: request.date, price: request.price, dataVersion: data.dataVersion, seats: flight.seats, demand, sales, freeSeats: flight.seats - sales, quantiles };
}
