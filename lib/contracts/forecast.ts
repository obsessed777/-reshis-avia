export type ForecastRequest = { origin: string; destination: string; date: string; price: number };
export type Forecast = {
  route: string; date: string; price: number; dataVersion: string;
  seats: number; demand: number; sales: number; freeSeats: number;
  quantiles: { quantile: number; demand: number }[];
};
export type RouteMetadata = { route: string; origin: string; destination: string; basePrice: number; priceMin: number; priceMax: number; dates: string[] };
export type RoutesResponse = { dataVersion: string; routes: RouteMetadata[] };
export type ApiError = { error: { code: string; fields?: Record<string, string> } };
