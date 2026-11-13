export const forecastInfoCopy = {
  ru: {
    eyebrow: 'Данные и интерпретация', title: 'О прогнозе',
    coverageTitle: 'Охват данных', coverage: 'Готовый прогноз модели охватывает пять направлений из Москвы с 1 июня по 1 июля 2026 года. Для одного рейса можно сравнивать разные цены билета.',
    interpretationTitle: 'Спрос и продажи', interpretation: 'Спрос может превышать вместимость самолёта. Ожидаемые продажи ограничены количеством мест на рейсе.',
    limitsTitle: 'Границы прогноза', limits: 'Прогноз даёт оценку возможного спроса и не гарантирует фактические продажи.',
    footerDescription: 'Рабочий инструмент для оценки спроса на авиарейсы.', footerNav: 'Навигация в подвале', forecast: 'К расчёту', about: 'О прогнозе', top: 'Наверх', project: 'Учебный проект',
  },
  en: {
    eyebrow: 'Data and interpretation', title: 'About the forecast',
    coverageTitle: 'Data coverage', coverage: 'The prepared model forecast covers five routes from Moscow from June 1 to July 1, 2026. You can compare ticket prices for the same flight.',
    interpretationTitle: 'Demand and sales', interpretation: 'Demand can exceed aircraft capacity. Expected sales are limited by the number of seats on the flight.',
    limitsTitle: 'Forecast limits', limits: 'The forecast estimates possible demand and does not guarantee actual sales.',
    footerDescription: 'A working tool for estimating flight demand.', footerNav: 'Footer navigation', forecast: 'Go to forecast', about: 'About the forecast', top: 'Back to top', project: 'Educational project',
  },
} as const;

export type ForecastInfoCopy = (typeof forecastInfoCopy)[keyof typeof forecastInfoCopy];
