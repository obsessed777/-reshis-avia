'use client';
import { useState, type FormEvent, type RefObject } from 'react';
import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import { authCopy, type AuthErrorCode } from '@/lib/i18n/auth';
import type { AuthUser } from '@/components/auth/useAuth';
import styles from '@/components/auth/auth.module.css';

export default function AuthDialog({ dialogRef, t, locale = 'ru', onAuthenticated }: { dialogRef: RefObject<HTMLDialogElement>; t: ShellCopy; locale?: Locale; onAuthenticated?: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const text = authCopy[locale];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (password.length < 8 || password.length > 1024 || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('invalid_input'); return; }
    setBusy(true);
    try {
      const result = await fetch('/api/auth/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store' });
      const data = await result.json();
      if (!result.ok) {
        const codes: AuthErrorCode[] = ['invalid_input', 'invalid_credentials', 'account_exists', 'rate_limit', 'confirmation_enabled', 'forbidden'];
        setError(codes.includes(data.error) ? data.error : 'unavailable'); return;
      }
      if (!data.user?.id || !data.user?.email) { setError('unavailable'); return; }
      onAuthenticated?.(data.user); setPassword(''); dialogRef.current?.close();
    } catch { setError('unavailable'); }
    finally { setBusy(false); }
  }
  return (
    <dialog ref={dialogRef} className={'auth-dialog ' + styles.dialog} aria-labelledby='auth-title' onClick={event => { if (event.target === event.currentTarget && !busy) event.currentTarget.close(); }}>
      <div className='dialog-head'>
        <h2 id='auth-title'>{mode === 'login' ? text.loginTitle : text.registerTitle}</h2>
        <button type='button' aria-label={t.close} disabled={busy} onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      <form onSubmit={submit} className={styles.form} noValidate>
        <label htmlFor='auth-email'>{text.email}</label>
        <input id='auth-email' type='email' autoComplete='email' required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
        <label htmlFor='auth-password'>{text.password}</label>
        <input id='auth-password' type='password' autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={1024} aria-describedby='password-hint' value={password} onChange={event => setPassword(event.target.value)} />
        <p id='password-hint' className={styles.hint}>{text.hint}</p>
        {error && <p role='alert' className={styles.error}>{text[error]}</p>}
        <button type='submit' className={styles.submit} disabled={busy}>{busy ? text.loading : mode === 'login' ? text.login : text.register}</button>
      </form>
      <button type='button' className={styles.switch} disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>{mode === 'login' ? text.switchRegister : text.switchLogin}</button>
    </dialog>
  );
}
