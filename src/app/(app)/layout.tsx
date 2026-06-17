'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppNav } from '@/components/layout/AppNav';
import { LandingNav } from '@/components/layout/LandingNav';

type AppState = { user: { name: string; email: string }; plan: 'free' | 'pro' | 'banda' } | null;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDemoPlayer = pathname === '/player';
  const [state, setState] = useState<AppState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isDemoPlayer) {
      try {
        const raw = localStorage.getItem('cordeband_state_v1');
        setState(raw ? JSON.parse(raw) as AppState : null);
      } catch {
        setState(null);
      }
      setReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem('cordeband_state_v1');
      const parsed = raw ? JSON.parse(raw) as AppState : null;
      if (!parsed?.user) { router.replace('/login'); return; }
      setState(parsed);
    } catch { router.replace('/login'); return; }
    setReady(true);
  }, [router, isDemoPlayer]);

  if (!ready) return null;

  if (isDemoPlayer && !state?.user) {
    return (
      <>
        <LandingNav />
        <main style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--surface)' }}>
          {children}
        </main>
      </>
    );
  }

  if (!state?.user) return null;

  return (
    <>
      <AppNav user={state.user} plan={state.plan ?? 'free'} />
      <main style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--surface)' }}>
        {children}
      </main>
    </>
  );
}
