import { Suspense } from 'react';
import { LandingNav } from '@/components/layout/LandingNav';
import { RecoveryContinueForm } from '@/components/auth/RecoveryContinueForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Restablecer contraseña — Cordeband' };

export default function RecoveryContinuePage() {
  return (
    <>
      <LandingNav />
      <Suspense fallback={null}>
        <RecoveryContinueForm />
      </Suspense>
    </>
  );
}
