import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import { authCopy } from '@/lib/i18n/auth';
import { historyCopy } from '@/lib/i18n/history';
import type { AuthUser } from '@/components/auth/useAuth';
import styles from '@/components/auth/auth.module.css';
import historyStyles from '@/components/history/History.module.css';
import Icon from './Icon';

export default function Header({ locale, setLocale, onLogin, t, user, onLogout, authBusy, logoutError }: { locale: Locale; setLocale: (locale: Locale) => void; onLogin: () => void; t: ShellCopy; user?: AuthUser | null; onLogout?: () => void; authBusy?: boolean; logoutError?: boolean }) {
  const text = authCopy[locale];
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
          {user ? <details className={styles.account}>
            <summary className='login'>{text.account}</summary>
            <div className={styles.menu}><span className={styles.email}>{user.email}</span><a className={historyStyles.menuLink} href='#history' onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>{historyCopy[locale].title}</a><button type='button' disabled={authBusy} onClick={onLogout}>{authBusy ? text.loading : text.logout}</button></div>
          </details> : <button className='login' type='button' onClick={onLogin}>{t.login}</button>}
          {logoutError && <span role='alert' className={styles.logoutError}>{text.logoutError}</span>}
        </div>
      </div>
    </header>
  );
}
