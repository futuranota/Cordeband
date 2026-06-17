import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear cuenta — Cordeband' };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm mode="signup" />
    </Suspense>
  );
}
