import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio — Cordeband',
  description: 'Crea la canción que vas a practicar: estructura, letra y prompt listo para Suno.',
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
