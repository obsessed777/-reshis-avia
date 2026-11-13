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

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ru');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [result, setResult] = useState<Forecast | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = copy[locale];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => () => activeRequest.current?.abort(), []);

  function editForecast() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setPending(false);
    setError(null);
  }
  async function submitForecast(request: ForecastRequest) {
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
    } catch {
      if (!controller.signal.aborted) setError('DATA_UNAVAILABLE');
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }

  return (
    <>
      <Header locale={locale} setLocale={setLocale} onLogin={() => dialogRef.current?.showModal()} t={t} />
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
          <ForecastForm t={t} locale={locale} pending={pending} error={error} onSubmit={submitForecast} onEdit={editForecast} />
          <ForecastResults result={result} locale={locale} t={t} />
          <ForecastInfo t={forecastInfoCopy[locale]} />
        </div>
      </main>
      <Footer t={forecastInfoCopy[locale]} />
      <AuthDialog dialogRef={dialogRef} t={t} />
    </>
  );
}
