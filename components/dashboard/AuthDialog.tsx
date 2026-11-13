import type { RefObject } from 'react';
import type { ShellCopy } from '@/lib/i18n/shell';

export default function AuthDialog({ dialogRef, t }: { dialogRef: RefObject<HTMLDialogElement>; t: ShellCopy }) {
  return (
    <dialog ref={dialogRef} className='auth-dialog' aria-labelledby='auth-title' aria-describedby='auth-status'
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className='dialog-head'>
        <h2 id='auth-title'>{t.account}</h2>
        <button type='button' aria-label={t.close} onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      <p id='auth-status' className='muted'>{t.authUnavailable}</p>
      <form onSubmit={event => event.preventDefault()}>
        <label htmlFor='email'>{t.email}</label>
        <input id='email' type='email' autoComplete='email' disabled />
        <label htmlFor='password'>{t.password}</label>
        <input id='password' type='password' autoComplete='current-password' disabled />
        <button type='submit' disabled>{t.login}</button>
      </form>
    </dialog>
  );
}
