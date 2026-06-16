import { UploadScreen } from '@/components/screens/UploadScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agregar canción — Cordeband' };

export default function UploadPage() {
  return <UploadScreen />;
}
