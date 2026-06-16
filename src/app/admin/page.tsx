import { AdminScreen } from '@/components/screens/AdminScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Cordeband' };

export default function AdminPage() {
  return <AdminScreen />;
}
