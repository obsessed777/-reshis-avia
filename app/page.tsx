'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import AuthDialog from '@/components/dashboard/AuthDialog';
import ForecastForm from '@/components/dashboard/ForecastForm';
import ForecastResults from '@/components/dashboard/ForecastResults';
import Header from '@/components/dashboard/Header';
import { copy, type Locale } from '@/lib/i18n/shell';

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
            <Image src='https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80' alt='' fill priority sizes='(max-width: 767px) 100vw, 70vw' style={{ objectFit: 'cover', objectPosition: 'center' }} />
          </div>
          <div className='hero-content'>
            <h1>{t.titleLine1}<br />{t.titleLine2}</h1>
            <p className='hero-subtitle'>{t.subtitle}</p>
          </div>
        </section>
        <div className='content-wrap' id='forecast'>
          <ForecastForm t={t} />
          <ForecastResults result={null} locale={locale} t={t} />
        </div>
      </main>
      <AuthDialog dialogRef={dialogRef} t={t} />
    </>
  );
}
