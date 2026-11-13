'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HistoryItem, HistoryPage } from '@/lib/contracts/history';
import type { Locale } from '@/lib/i18n/shell';
import { historyCopy } from '@/lib/i18n/history';
import styles from './History.module.css';

export default function History({ locale, refresh, onOpenStart, onOpen }: { locale: Locale; refresh: number; onOpenStart: () => number; onOpen: (item: HistoryItem, version: number) => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [openFailed, setOpenFailed] = useState(false);
  const requests = useRef(new Set<AbortController>());
  const openRequest = useRef<AbortController | null>(null);
  const text = historyCopy[locale];
  const load = useCallback(async (start: number) => {
    const controller = new AbortController();
    requests.current.add(controller);
    setLoading(true); setFailed(false);
    try {
      const response = await fetch(`/api/history?offset=${start}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error();
      const page = await response.json() as HistoryPage;
      if (controller.signal.aborted) return;
      setItems(previous => start ? [...previous, ...page.items] : page.items);
      setOffset(page.nextOffset); setHasMore(page.hasMore);
    } catch { if (!controller.signal.aborted) setFailed(true); }
    finally { requests.current.delete(controller); if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const active = requests.current;
    active.forEach(controller => controller.abort()); active.clear();
    setItems([]); setOffset(0); setHasMore(false);
    setOpening(null); setOpenFailed(false);
    void load(0);
    return () => { active.forEach(controller => controller.abort()); active.clear(); openRequest.current?.abort(); };
  }, [load, refresh]);
  async function open(id: string) {
    const version = onOpenStart();
    openRequest.current?.abort();
    const controller = new AbortController(); openRequest.current = controller;
    setOpening(id); setOpenFailed(false);
    try {
      const response = await fetch(`/api/history/${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error();
      const item = await response.json() as HistoryItem;
      if (!controller.signal.aborted) onOpen(item, version);
    } catch { if (!controller.signal.aborted) setOpenFailed(true); }
    finally { if (!controller.signal.aborted) setOpening(null); }
  }
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return <section className={styles.section} id='history' aria-labelledby='history-title'>
    <h2 className={styles.heading} id='history-title'>{text.title}</h2><p className={styles.description}>{text.description}</p>
    {items.length > 0 && <div className={styles.scroll} tabIndex={0} role='region' aria-label={text.scroll}><table className={styles.table} aria-label={text.title}><thead><tr>{[text.created, text.route, text.date, text.price, text.demand, text.sales, text.free, text.seats, ''].map((heading, index) => <th key={index} scope='col'>{heading}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.id}><td><time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time></td><td>{item.forecast.route}</td><td><time dateTime={item.forecast.date}>{item.forecast.date}</time></td><td>{number.format(item.forecast.price)}</td><td>{number.format(item.forecast.demand)}</td><td>{number.format(item.forecast.sales)}</td><td>{number.format(item.forecast.freeSeats)}</td><td>{number.format(item.forecast.seats)}</td><td><button className={styles.button} type='button' disabled={opening !== null} onClick={() => void open(item.id)}>{opening === item.id ? text.opening : text.open}</button></td></tr>)}</tbody></table></div>}
    {loading && <p className={styles.message} role='status'>{text.loading}</p>}
    {!loading && !failed && items.length === 0 && <p className={styles.message}>{text.empty}</p>}
    {failed && <p className={styles.message} role='alert'>{text.failed} <button className={styles.button} type='button' onClick={() => void load(items.length ? offset : 0)}>{text.retry}</button></p>}
    {openFailed && <p className={styles.message} role='alert'>{text.openFailed}</p>}
    {hasMore && !failed && <button className={`${styles.button} ${styles.more}`} type='button' disabled={loading} onClick={() => void load(offset)}>{text.more}</button>}
  </section>;
}
