import { PlayerScreen } from '@/components/screens/PlayerScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reproductor — Cordeband' };

export default function PlayerPage() {
  return <PlayerScreen />;
}
