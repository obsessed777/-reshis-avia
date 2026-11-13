import type { Forecast } from './forecast';

export type HistoryItem = { id: string; createdAt: string; forecast: Forecast };
export type HistoryPage = { items: HistoryItem[]; hasMore: boolean; nextOffset: number };
