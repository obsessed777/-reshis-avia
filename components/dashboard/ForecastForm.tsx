import { useState } from 'react';
import type { ShellCopy } from '@/lib/i18n/shell';
import Icon from './Icon';

const destinations = ['AER', 'KGD', 'LED', 'MRV', 'OVB'];

export default function ForecastForm({ t }: { t: ShellCopy }) {
  const [destination, setDestination] = useState('AER');
  const [date, setDate] = useState('2026-06-01');
  const [price, setPrice] = useState('');
  return (
    <>
      <form className='forecast-form' onSubmit={event => event.preventDefault()}>
        <div className='field'><label htmlFor='origin'>{t.from}</label><input id='origin' value={t.moscow} readOnly /></div>
        <div className='field'>
          <label htmlFor='destination'>{t.to}</label>
          <select id='destination' value={destination} onChange={event => setDestination(event.target.value)}>
            {destinations.map((code, i) => <option key={code} value={code}>{t.cities[i]}</option>)}
          </select>
        </div>
        <div className='field'><label htmlFor='date'>{t.date}</label><input id='date' type='date' min='2026-06-01' max='2026-07-01' value={date} onChange={event => setDate(event.target.value)} /></div>
        <div className='field'><label htmlFor='price'>{t.price}</label><input id='price' type='number' min='0.01' step='0.01' inputMode='decimal' value={price} onChange={event => setPrice(event.target.value)} placeholder='—' /></div>
        <button className='calculate' type='submit' disabled aria-describedby='calc-status'>{t.calculate}<Icon name='arrow' /></button>
      </form>
      <p className='status' id='calc-status'>{t.unavailable}</p>
    </>
  );
}
