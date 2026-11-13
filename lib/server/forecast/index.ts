import 'server-only';
import data from './data.json';
import { calculate, metadata } from './core';
import type { ForecastRequest } from '../../contracts/forecast';

export const getRoutes = () => metadata(data);
export const getForecast = (request: ForecastRequest) => calculate(data, request);
