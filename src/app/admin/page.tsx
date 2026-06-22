import { AdminScreen } from '@/components/screens/AdminScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Cordeband' };

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminScreen />;
}
