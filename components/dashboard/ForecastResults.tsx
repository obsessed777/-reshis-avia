import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import type { Forecast } from '@/lib/contracts/forecast';
import { calculatorCopy } from '@/lib/i18n/calculator';
import Icon from './Icon';
import DemandChart from './DemandChart';

export function ChartPlaceholder({ t }: { t: ShellCopy }) {
  return (
    <div className='chart-panel'>
      <div className='chart-main'>
        <h2>{t.chart}</h2>
        <p className='muted'>{t.chartSub}</p>
        <div className='chart-empty' role='img' aria-label={[t.chart, t.chartEmpty, t.axisX, t.axisY].join('. ')}>
          <div className='chart-grid' aria-hidden='true' />
          <span>{t.chartEmpty}</span>
        </div>
        <div className='chart-axis'><span>{t.axisY}</span><span>{t.axisX}</span></div>
      </div>
      <aside className='chart-guide'>
        <h3>{t.guide}</h3>
        <p>{t.guideIntro}</p>
        <ul><li>{t.median}</li><li>{t.capacity}</li><li>{t.tails}</li></ul>
      </aside>
    </div>
  );
}

export default function ForecastResults({ result, locale, t }: { result: Forecast | null; locale: Locale; t: ShellCopy }) {
  const cards = [
    { label: t.seats, value: result?.seats, icon: 'seat' },
    { label: t.demand, value: result?.demand, icon: 'chart' },
    { label: t.sales, value: result?.sales, icon: 'stack' },
    { label: t.free, value: result?.freeSeats, icon: 'seat' },
  ] as const;
  return (
    <section className='results' aria-labelledby='results-heading'>
      <div className='section-heading'><h2 id='results-heading'>{t.results}</h2><span>{result ? `${calculatorCopy[locale].resultFor}: ${result.route} · ${result.date} · ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(result.price)} ₽` : t.after}</span></div>
      <div className='metrics'>
        {cards.map(card => (
          <article className='metric' key={card.label}>
            <span className='metric-icon'><Icon name={card.icon} /></span>
            <div>
              <h3>{card.label}</h3>
              <p className={card.value === undefined ? 'metric-placeholder' : 'metric-value'}>
                {card.value === undefined ? t.noResult : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(card.value)}
              </p>
            </div>
          </article>
        ))}
      </div>
      {result ? <DemandChart result={result} locale={locale} t={t} /> : <ChartPlaceholder t={t} />}
    </section>
  );
}
