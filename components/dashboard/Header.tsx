import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import Icon from './Icon';

export default function Header({ locale, setLocale, onLogin, t }: { locale: Locale; setLocale: (locale: Locale) => void; onLogin: () => void; t: ShellCopy }) {
  return (
    <header className='site-header'>
      <div className='header-inner'>
        <a href='#top' className='brand' aria-label='Решись Авиа'><Icon name='plane' /><span>РЕШИСЬ <b>АВИА</b></span></a>
        <nav aria-label={t.nav}><a href='#forecast' className='nav-active'>{t.nav}</a></nav>
        <div className='header-actions'>
          <div className='languages' role='group' aria-label={t.language}>
            <button type='button' aria-pressed={locale === 'ru'} onClick={() => setLocale('ru')}>RU</button>
            <span aria-hidden='true'>/</span>
            <button type='button' aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          </div>
          <button className='login' type='button' onClick={onLogin}>{t.login}</button>
        </div>
      </div>
    </header>
  );
}
