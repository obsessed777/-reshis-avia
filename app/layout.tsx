import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
export const metadata: Metadata = { title: 'Решись Авиа — прогноз спроса', description: 'Прогноз спроса на авиарейсы.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang='ru' className={inter.variable}><body>{children}</body></html>;
}
