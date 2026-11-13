import type { ForecastInfoCopy } from '@/lib/i18n/forecast-info';

export default function ForecastInfo({ t }: { t: ForecastInfoCopy }) {
  return (
    <section className='forecast-info' id='about-forecast' aria-labelledby='about-forecast-title'>
      <div className='forecast-info-heading'>
        <p className='eyebrow'>{t.eyebrow}</p>
        <h2 id='about-forecast-title'>{t.title}</h2>
      </div>
      <div className='forecast-info-columns'>
        <div><h3>{t.coverageTitle}</h3><p>{t.coverage}</p></div>
        <div><h3>{t.interpretationTitle}</h3><p>{t.interpretation}</p></div>
        <div><h3>{t.limitsTitle}</h3><p>{t.limits}</p></div>
      </div>
    </section>
  );
}
