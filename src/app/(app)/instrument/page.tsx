import { InstrumentScreen } from '@/components/screens/InstrumentScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Instrumento — Cordeband' };

export default function InstrumentPage() {
  return <InstrumentScreen />;
}
