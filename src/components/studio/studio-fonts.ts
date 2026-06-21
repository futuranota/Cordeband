import { Manrope, Sora } from 'next/font/google';

export const studioDisplay = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

export const studioSans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const studioFontClassName = `${studioDisplay.variable} ${studioSans.variable}`;
