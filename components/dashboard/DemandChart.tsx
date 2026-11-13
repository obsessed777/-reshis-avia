import type { Forecast } from '@/lib/contracts/forecast';
import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import { chartCopy } from '@/lib/i18n/chart';
import styles from './DemandChart.module.css';

export default function DemandChart({ result, locale, t }: { result: Forecast; locale: Locale; t: ShellCopy }) {
  const copy = chartCopy[locale];
  const format = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const values = result.quantiles;
  const min = Math.min(0, result.seats, ...values.map(point => point.demand));
  const max = Math.max(0, result.seats, ...values.map(point => point.demand));
  const span = max - min || 1;
  const roughStep = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10].map(factor => factor * magnitude).find(value => value >= roughStep) ?? magnitude * 10;
  const low = min < 0 ? Math.floor((min - span * 0.05) / step) * step : 0;
  const high = Math.ceil((max + span * 0.08) / step) * step;
  const ticks = Array.from({ length: Math.round((high - low) / step) + 1 }, (_, index) => low + index * step);
  const left = 86, right = 668, top = 30, bottom = 250;
  const x = (index: number) => left + index * (right - left) / 8;
  const y = (value: number) => bottom - (value - low) / (high - low) * (bottom - top);
  const points = values.map((point, index) => `${x(index)},${y(point.demand)}`).join(' ');
  const area = `${left},${bottom} ${points} ${right},${bottom}`;
  const q90 = values.find(point => point.quantile === 0.9)?.demand;

  return (
    <div className={`chart-panel ${styles.panel}`}>
      <div className='chart-main'>
        <h2>{t.chart}</h2>
        <p className='muted'>{t.chartSub}</p>
        <figure className={styles.figure}>
          <figcaption className={styles.srOnly}>{copy.caption}</figcaption>
          <div className={styles.scroll} tabIndex={0} role='region' aria-label={copy.scroll}>
            <svg className={styles.svg} viewBox='0 0 700 290' role='img' aria-labelledby='demand-chart-title demand-chart-description'>
              <title id='demand-chart-title'>{t.chart}</title>
              <desc id='demand-chart-description'>{copy.description}</desc>
              {ticks.map((value, index) => {
                return <g key={index}><line x1={left} x2={right} y1={y(value)} y2={y(value)} className={styles.grid} /><text x={left - 10} y={y(value) + 4} textAnchor='end' className={styles.axisText}>{format(value)}</text></g>;
              })}
              <polygon points={area} className={styles.area} />
              <line x1={left} x2={right} y1={y(result.seats)} y2={y(result.seats)} className={styles.capacityLine} />
              <line x1={x(4)} x2={x(4)} y1={top} y2={bottom} className={styles.medianLine} />
              <polyline points={points} className={styles.line} />
              {values.map((point, index) => <g key={point.quantile}>
                <circle cx={x(index)} cy={y(point.demand)} r={index === 4 ? 5 : 3.5} className={index === 4 ? styles.medianPoint : styles.point} />
                <text x={x(index)} y={y(point.demand) - (index % 2 ? 17 : 9)} textAnchor='middle' className={styles.valueText}>{format(point.demand)}</text>
                <text x={x(index)} y='273' textAnchor='middle' className={styles.axisText}>Q{Math.round(point.quantile * 100)}</text>
              </g>)}
            </svg>
          </div>
          <div className='chart-axis'><span>{t.axisY}</span><span>{t.axisX}</span></div>
          <div className={styles.legend} aria-hidden='true'><span><i className={styles.legendLine} />{copy.demand}</span><span><i className={styles.legendCapacity} />{copy.capacity}</span><span><i className={styles.legendMedian} />{copy.median}</span></div>
          <div className={styles.srOnly}><table>
            <caption>{copy.caption}</caption>
            <thead><tr><th>{t.axisX}</th><th>{t.axisY}</th></tr></thead>
            <tbody>{values.map(point => <tr key={point.quantile}><th scope='row'>Q{Math.round(point.quantile * 100)}</th><td>{format(point.demand)}</td></tr>)}</tbody>
          </table></div>
        </figure>
      </div>
      <aside className='chart-guide'>
        <h3>{t.guide}</h3><p>{t.guideIntro}</p>
        <ul><li>{copy.q50(format(result.demand))}</li>{q90 !== undefined && <li>{copy.q90(format(q90))}</li>}<li>{copy.seats(format(result.seats))}</li><li>{copy.tails}</li></ul>
      </aside>
    </div>
  );
}
