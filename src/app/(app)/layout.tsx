'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/layout/AppNav';

type AppState = { user: { name: string; email: string }; plan: 'free' | 'pro' | 'banda' } | null;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cordeband_state_v1');
      const parsed = raw ? JSON.parse(raw) as AppState : null;
      if (!parsed?.user) { router.replace('/login'); return; }
      setState(parsed);
    } catch { router.replace('/login'); return; }
    setReady(true);
  }, [router]);

  if (!ready || !state) return null;

  return (
    <>
      <AppNav user={state.user} plan={state.plan ?? 'free'} />
      <main style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--surface)' }}>
        {children}
      </main>
    </>
  );
}
