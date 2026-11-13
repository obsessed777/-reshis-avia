'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import AuthDialog from '@/components/dashboard/AuthDialog';
import ForecastForm from '@/components/dashboard/ForecastForm';
import ForecastResults from '@/components/dashboard/ForecastResults';
import ForecastInfo from '@/components/dashboard/ForecastInfo';
import Footer from '@/components/dashboard/Footer';
import Header from '@/components/dashboard/Header';
import { copy, type Locale } from '@/lib/i18n/shell';
import { forecastInfoCopy } from '@/lib/i18n/forecast-info';
import type { Forecast, ForecastRequest } from '@/lib/contracts/forecast';
import { useAuth } from '@/components/auth/useAuth';
import History from '@/components/history/History';
import historyStyles from '@/components/history/History.module.css';
import { historyCopy } from '@/lib/i18n/history';
import type { HistoryItem } from '@/lib/contracts/history';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ru');
  const auth = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const saveRequests = useRef(new Set<AbortController>());
  const userId = useRef(auth.user?.id);
  const calculationVersion = useRef(0);
  const saveVersion = useRef(0);
  const [saveState, setSaveState] = useState<{ user: string; status: 'saving' | 'saved' | 'failed' } | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [formInitial, setFormInitial] = useState<ForecastRequest>();
  const [formKey, setFormKey] = useState(0);
  const [historyOwner, setHistoryOwner] = useState<string | null>(null);
  const [result, setResult] = useState<Forecast | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = copy[locale];
  if (userId.current !== auth.user?.id) {
    userId.current = auth.user?.id;
    calculationVersion.current++;
    saveVersion.current++;
  }
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    if (historyOwner && historyOwner !== auth.user?.id) {
      setHistoryOwner(null); setResult(null); setFormInitial(undefined); setFormKey(value => value + 1);
    }
  }, [auth.user?.id, historyOwner]);
  useEffect(() => {
    const saves = saveRequests.current;
    return () => { saves.forEach(controller => controller.abort()); saves.clear(); };
  }, [auth.user?.id]);
  useEffect(() => () => activeRequest.current?.abort(), []);

  function editForecast() {
    calculationVersion.current++;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setPending(false);
    setError(null);
  }
  async function submitForecast(request: ForecastRequest) {
    const version = ++calculationVersion.current;
    const statusVersion = ++saveVersion.current;
    const requestUser = userId.current;
    setSaveState(null);
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal: controller.signal });
      const payload = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) { setError(payload?.error?.code ?? 'DATA_UNAVAILABLE'); return; }
      setResult(payload as Forecast);
      setHistoryOwner(null);
      if (requestUser && requestUser === userId.current && version === calculationVersion.current) {
        const saveController = new AbortController();
        saveRequests.current.add(saveController);
        setSaveState({ user: requestUser, status: 'saving' });
        void fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), cache: 'no-store', signal: saveController.signal }).then(response => {
          if (!response.ok) throw new Error();
          if (!saveController.signal.aborted && userId.current === requestUser) {
            if (statusVersion === saveVersion.current) setSaveState({ user: requestUser, status: 'saved' });
            setHistoryRefresh(value => value + 1);
          }
        }).catch(() => { if (!saveController.signal.aborted && userId.current === requestUser && statusVersion === saveVersion.current) setSaveState({ user: requestUser, status: 'failed' }); })
          .finally(() => saveRequests.current.delete(saveController));
      }
    } catch {
      if (!controller.signal.aborted) setError('DATA_UNAVAILABLE');
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }
  function openHistoryStart() { editForecast(); return calculationVersion.current; }
  function openHistory(item: HistoryItem, version: number) {
    if (version !== calculationVersion.current) return;
    editForecast();
    saveVersion.current++;
    setSaveState(null);
    const [origin, destination] = item.forecast.route.split('-');
    setFormInitial({ origin, destination, date: item.forecast.date, price: item.forecast.price });
    setFormKey(value => value + 1);
    setResult(item.forecast);
    setHistoryOwner(userId.current ?? null);
    document.getElementById('forecast')?.scrollIntoView();
  }

  return (
    <>
      <Header locale={locale} setLocale={setLocale} onLogin={() => dialogRef.current?.showModal()} t={t} user={auth.user} onLogout={auth.logout} authBusy={auth.busy} logoutError={auth.logoutError} />
      <main id='top'>
        <section className='hero'>
          <div className='hero-image'>
            <Image src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=2560&q=80' alt='' fill priority sizes='100vw' style={{ objectFit: 'cover', objectPosition: 'center' }} />
          </div>
          <div className='hero-content'>
            <p className='eyebrow'>{t.eyebrow}</p>
            <h1>{t.titleLine1}<br />{t.titleLine2}</h1>
            <p className='hero-subtitle'>{t.subtitle}</p>
            <a className='hero-cta' href='#forecast'>{t.heroCta}<span aria-hidden='true'>↗</span></a>
          </div>
        </section>
        <div className='content-wrap' id='forecast'>
          <ForecastForm key={`${formKey}-${historyOwner && historyOwner !== auth.user?.id ? 'clear' : 'same'}`} initial={!historyOwner || historyOwner === auth.user?.id ? formInitial : undefined} t={t} locale={locale} pending={pending} error={error} onSubmit={submitForecast} onEdit={editForecast} />
          <ForecastResults result={!historyOwner || historyOwner === auth.user?.id ? result : null} locale={locale} t={t} />
          {auth.user && saveState?.user === auth.user.id && <p className={historyStyles.status} role='status'>{historyCopy[locale][saveState.status === 'saving' ? 'saving' : saveState.status === 'saved' ? 'saved' : 'saveFailed']}</p>}
          {auth.user && <History key={auth.user.id} locale={locale} refresh={historyRefresh} onOpenStart={openHistoryStart} onOpen={openHistory} />}
          <ForecastInfo t={forecastInfoCopy[locale]} />
        </div>
      </main>
      <Footer t={forecastInfoCopy[locale]} />
      <AuthDialog dialogRef={dialogRef} t={t} locale={locale} onAuthenticated={auth.setUser} />
    </>
  );
}
