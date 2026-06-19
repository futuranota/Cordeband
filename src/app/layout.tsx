import type { Metadata, Viewport } from 'next';
import { Sora, Manrope } from 'next/font/google';
import './globals.css';
import { LangProvider } from '@/i18n/context';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Cordeband — El karaoke para músicos',
  description: 'Sube cualquier canción, quitamos tu instrumento de la mezcla y te damos la partitura sincronizada. Tú solo tocas.',
  icons: {
    icon: '/assets/Corderband-logo.svg',
    shortcut: '/assets/Corderband-logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body style={{ background: 'var(--bg)', minHeight: '100vh' }} suppressHydrationWarning>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
