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

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ru');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = copy[locale];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

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
          <ForecastForm t={t} />
          <ForecastResults result={null} locale={locale} t={t} />
          <ForecastInfo t={forecastInfoCopy[locale]} />
        </div>
      </main>
      <Footer t={forecastInfoCopy[locale]} />
      <AuthDialog dialogRef={dialogRef} t={t} />
    </>
  );
}
