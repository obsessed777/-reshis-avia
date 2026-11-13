'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { inputsCopy } from '@/lib/i18n/inputs';
import type { Locale } from '@/lib/i18n/shell';
import styles from './inputs.module.css';

export default function DestinationPicker({ value, options, locale, onChange }: { value: string; options: { value: string; label: string }[]; locale: Locale; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  function choose(index: number) { if (options[index]) onChange(options[index].value); setOpen(false); trigger.current?.focus(); }
  return <div className={styles.root} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button ref={trigger} id='destination' type='button' className={styles.trigger} role='combobox' aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup='listbox' aria-activedescendant={open ? `${id}-${active}` : undefined} onClick={() => { setActive(selected); setOpen(!open); }} onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); }
      else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); if (!open) { setActive(selected); setOpen(true); } else setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length); }
      else if (open && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); choose(active); }
    }}>{options[selected]?.label ?? value}<span className={styles.chevron} aria-hidden='true'>⌄</span></button>
    {open && <div id={`${id}-list`} role='listbox' aria-label={inputsCopy[locale].destinationList} className={styles.popup}>{options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role='option' aria-selected={option.value === value} className={`${styles.option} ${active === index ? styles.optionActive : ''}`} onPointerDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(index)}>{option.label}</div>)}</div>}
  </div>;
}
