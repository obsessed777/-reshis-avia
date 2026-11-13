import { useEffect, useState } from 'react';
import type { ForecastRequest, RoutesResponse } from '@/lib/contracts/forecast';
import { calculatorCopy } from '@/lib/i18n/calculator';
import type { Locale, ShellCopy } from '@/lib/i18n/shell';
import Icon from './Icon';

export default function ForecastForm({ t, locale, pending, error, onSubmit, onEdit }: { t: ShellCopy; locale: Locale; pending: boolean; error: string | null; onSubmit: (request: ForecastRequest) => void; onEdit: () => void }) {
  const [destination, setDestination] = useState('AER');
  const [date, setDate] = useState('2026-06-01');
  const [price, setPrice] = useState('');
  const [routes, setRoutes] = useState<RoutesResponse | null>(null);
  const [routesFailed, setRoutesFailed] = useState(false);
  const c = calculatorCopy[locale];
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/routes', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<RoutesResponse>;
    }).then(setRoutes).catch(() => { if (!controller.signal.aborted) setRoutesFailed(true); });
    return () => controller.abort();
  }, []);
  const current = routes?.routes.find(route => route.destination === destination && route.origin === 'MOW');
  const cities: Record<string, string> = { AER: t.cities[0], KGD: t.cities[1], LED: t.cities[2], MRV: t.cities[3], OVB: t.cities[4] };
  const message = error === 'FLIGHT_NOT_FOUND' ? c.notFound : error === 'BODY_TOO_LARGE' ? c.tooLarge : error === 'INVALID_FIELDS' || error === 'INVALID_JSON' ? c.invalid : error ? c.unavailable : routesFailed ? c.unavailable : !routes ? c.loadingRoutes : pending ? c.loading : '';
  return (
    <>
      <form className='forecast-form' noValidate onSubmit={event => { event.preventDefault(); onSubmit({ origin: 'MOW', destination, date, price: Number(price) }); }}>
        <div className='field'><label htmlFor='origin'>{t.from}</label><input id='origin' value={t.moscow} readOnly /></div>
        <div className='field'>
          <label htmlFor='destination'>{t.to}</label>
          <select id='destination' value={destination} onChange={event => { setDestination(event.target.value); onEdit(); }}>
            {(routes?.routes.map(r => r.destination) ?? ['AER', 'KGD', 'LED', 'MRV', 'OVB']).map(code => <option key={code} value={code}>{cities[code] ?? code}</option>)}
          </select>
        </div>
        <div className='field'><label htmlFor='date'>{t.date}</label><input id='date' type='date' value={date} onChange={event => { setDate(event.target.value); onEdit(); }} /></div>
        <div className='field'><label htmlFor='price'>{t.price}</label><input id='price' type='number' min='0.01' step='0.01' inputMode='decimal' value={price} onChange={event => { setPrice(event.target.value); onEdit(); }} placeholder='—' /></div>
        <button className='calculate' type='submit' disabled={pending} aria-describedby='calc-status'>{pending ? c.loading : t.calculate}<Icon name='arrow' /></button>
      </form>
      <p className='status' id='calc-status' role='status'>{message || (current ? `${c.recommendation}: ${new Intl.NumberFormat(locale).format(current.priceMin)}–${new Intl.NumberFormat(locale).format(current.priceMax)} ₽` : '')}</p>
    </>
  );
}
