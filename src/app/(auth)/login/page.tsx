import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Iniciar sesión — Cordeband' };

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm mode="login" />
    </Suspense>
  );
}
