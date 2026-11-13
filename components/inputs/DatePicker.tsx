'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { inputsCopy } from '@/lib/i18n/inputs';
import type { Locale } from '@/lib/i18n/shell';
import styles from './inputs.module.css';

const iso = (day: Date) => day.toISOString().slice(0, 10);
const asDate = (value: string) => new Date(`${value}T00:00:00Z`);
const shift = (value: string, days: number) => { const day = asDate(value); day.setUTCDate(day.getUTCDate() + days); return iso(day); };
const first = '2026-06-01';
const last = '2026-07-01';

export default function DatePicker({ value, available, locale, onChange }: { value: string; available: string[]; locale: Locale; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7) === '2026-07' ? 7 : 6);
  const [focused, setFocused] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cells = useRef<Record<string, HTMLButtonElement | null>>({});
  const gridId = useId();
  const t = inputsCopy[locale];
  const supported = (day: string) => day >= first && day <= last && available.includes(day);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  useEffect(() => { if (open) cells.current[focused]?.focus(); }, [focused, month, open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  function show() {
    const next = supported(value) ? value : available.find(supported);
    setMonth(next?.slice(0, 7) === '2026-07' ? 7 : 6);
    if (next) setFocused(next);
    setOpen(true);
  }
  function goToMonth(next: number) {
    setMonth(next);
    const candidate = available.find(day => supported(day) && Number(day.slice(5, 7)) === next);
    if (candidate) setFocused(candidate);
  }
  function move(day: string, direction: number) {
    let next = day;
    while (next >= first && next <= last && !supported(next)) next = shift(next, direction);
    if (supported(next)) { setFocused(next); setMonth(Number(next.slice(5, 7))); }
  }
  const firstDay = new Date(Date.UTC(2026, month - 1, 1));
  const start = (firstDay.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(2026, month, 0)).getUTCDate();
  const rows = Math.ceil((start + count) / 7);
  const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(firstDay);
  return <div className={styles.root} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button ref={trigger} id='date' type='button' className={styles.trigger} aria-haspopup='grid' aria-expanded={open} aria-controls={gridId} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); close(); } }}>{format.format(asDate(value))}<span className={styles.chevron} aria-hidden='true'>⌄</span></button>
    {open && <div className={`${styles.popup} ${styles.calendar}`} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }}>
      <div className={styles.calendarHead}><button className={styles.nav} type='button' aria-label={t.previousMonth} disabled={month === 6} onClick={() => goToMonth(6)}>‹</button><span aria-live='polite'>{monthName}</span><button className={styles.nav} type='button' aria-label={t.nextMonth} disabled={month === 7} onClick={() => goToMonth(7)}>›</button></div>
      <div id={gridId} role='grid' aria-label={`${t.calendar}: ${monthName}`} className={styles.grid}>
        <div role='row' className={styles.row}>{t.weekdays.map(day => <div role='columnheader' key={day} className={styles.weekday}>{day}</div>)}</div>
        {Array.from({ length: rows }, (_, row) => <div role='row' className={styles.row} key={row}>{Array.from({ length: 7 }, (_, column) => {
          const number = row * 7 + column - start + 1;
          if (number < 1 || number > count) return <span key={column} role='gridcell' aria-disabled='true' />;
          const day = `2026-${String(month).padStart(2, '0')}-${String(number).padStart(2, '0')}`;
          return <button key={day} ref={element => { cells.current[day] = element; }} type='button' role='gridcell' aria-label={format.format(asDate(day))} aria-selected={day === value} disabled={!supported(day)} tabIndex={day === focused ? 0 : -1} className={styles.day} onClick={() => { onChange(day); close(); }} onKeyDown={event => {
            let delta = 0;
            if (event.key === 'ArrowLeft') delta = -1; else if (event.key === 'ArrowRight') delta = 1; else if (event.key === 'ArrowUp') delta = -7; else if (event.key === 'ArrowDown') delta = 7; else if (event.key === 'Home') delta = -column; else if (event.key === 'End') delta = 6 - column; else return;
            event.preventDefault(); if (delta) move(shift(day, delta), delta < 0 ? -1 : 1);
          }}>{number}</button>;
        })}</div>)}
      </div>
    </div>}
  </div>;
}
