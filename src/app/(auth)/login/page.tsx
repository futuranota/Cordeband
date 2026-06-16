import { SignupForm } from '@/components/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Iniciar sesión — Cordeband' };

export default function LoginPage() {
  return <SignupForm mode="login" />;
}
