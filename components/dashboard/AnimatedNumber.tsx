'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Locale } from '@/lib/i18n/shell';
import styles from './AnimatedNumber.module.css';

const mediaQuery = '(prefers-reduced-motion: reduce)';
function subscribe(listener: () => void) {
  const media = window.matchMedia(mediaQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const reducedSnapshot = () => window.matchMedia(mediaQuery).matches;
const serverSnapshot = () => true;

export default function AnimatedNumber({ value, locale, trigger }: { value: number; locale: Locale; trigger: object | null }) {
  const reduced = useSyncExternalStore(subscribe, reducedSnapshot, serverSnapshot);
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  const format = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);
  useEffect(() => {
    if (reduced || current.current === value) { current.current = value; setDisplay(value); return; }
    const start = current.current;
    const began = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, Math.max(0, (now - began) / 650));
      const next = progress === 1 ? value : start + (value - start) * (1 - (1 - progress) ** 3);
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, trigger, reduced]);
  // Assistive technology gets the final value, without announcements for every animation frame.
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}><span aria-hidden='true'>{format.format(reduced ? value : display)}</span><span className={styles.srOnly}>{format.format(value)}</span></span>;
}
