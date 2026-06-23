import { UploadModeSelector } from '@/components/screens/UploadModeSelector';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Agregar canción — Cordeband' };

export default function UploadPage() {
  return <UploadModeSelector />;
}
