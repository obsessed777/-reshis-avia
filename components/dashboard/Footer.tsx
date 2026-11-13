import type { ForecastInfoCopy } from '@/lib/i18n/forecast-info';
import Icon from './Icon';

export default function Footer({ t }: { t: ForecastInfoCopy }) {
  return (
    <footer className='site-footer'>
      <div className='footer-inner'>
        <div className='footer-main'>
          <div>
            <a href='#top' className='brand' aria-label='Решись Авиа'><Icon name='plane' /><span>РЕШИСЬ <b>АВИА</b></span></a>
            <p className='footer-description'>{t.footerDescription}</p>
          </div>
          <nav className='footer-nav' aria-label={t.footerNav}>
            <a href='#forecast'>{t.forecast}</a>
            <a href='#about-forecast'>{t.about}</a>
            <a href='#top'>{t.top} <span aria-hidden='true'>↗</span></a>
          </nav>
        </div>
        <div className='footer-meta'><span>© 2026 РЕШИСЬ АВИА</span><span>{t.project}</span></div>
      </div>
    </footer>
  );
}
