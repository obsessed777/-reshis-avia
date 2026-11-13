export const chartCopy = {
  ru: {
    caption: 'Квантили прогноза спроса при выбранной цене.',
    description: 'Линия соединяет девять квантилей спроса. Пунктирная горизонтальная линия показывает вместимость, вертикальная линия отмечает медиану.',
    scroll: 'График квантилей. Для просмотра всех значений прокручивайте горизонтально.',
    demand: 'Прогноз спроса', capacity: 'Вместимость', median: 'Медиана Q50',
    q50: (value: string) => `Q50 = ${value}: прогнозируемый спрос с вероятностью 50% не превышает этого значения.`,
    q90: (value: string) => `Q90 = ${value}: прогнозируемый спрос с вероятностью 90% не превышает этого значения.`,
    seats: (value: string) => `Вместимость рейса: ${value} мест.`,
    tails: 'Значения за пределами Q10–Q90 неизвестны.',
  },
  en: {
    caption: 'Demand forecast quantiles at the selected price.',
    description: 'The line connects nine demand quantiles. The dashed horizontal line shows capacity and the vertical line marks the median.',
    scroll: 'Quantile chart. Scroll horizontally to view all values.',
    demand: 'Forecast demand', capacity: 'Capacity', median: 'Median Q50',
    q50: (value: string) => `Q50 = ${value}: forecast demand has a 50% chance of not exceeding this value.`,
    q90: (value: string) => `Q90 = ${value}: forecast demand has a 90% chance of not exceeding this value.`,
    seats: (value: string) => `Flight capacity: ${value} seats.`,
    tails: 'Values outside Q10–Q90 are unknown.',
  },
} as const;
