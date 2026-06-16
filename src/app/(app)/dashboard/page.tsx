import { DashboardScreen } from '@/components/screens/DashboardScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Biblioteca — Cordeband' };

export default function DashboardPage() {
  return <DashboardScreen />;
}
