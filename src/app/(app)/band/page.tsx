import { BandScreen } from '@/components/screens/BandScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sala de banda — Cordeband' };

export default function BandPage() {
  return <BandScreen />;
}
