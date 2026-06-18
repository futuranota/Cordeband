'use client';

import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { AppNav } from '@/components/layout/AppNav';
import { LandingNav } from '@/components/layout/LandingNav';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { SessionProvider } from '@/contexts/SessionContext';
import type { Profile } from '@/types/database';
import { normalizePlan } from '@/lib/supabase/profile';

type AppShellProps = {
  user: User | null;
  profile: Profile | null;
  children: React.ReactNode;
};

export function AppShell({ user, profile, children }: AppShellProps) {
  const pathname = usePathname();
  const isDemoPlayer = pathname === '/player';

  if (isDemoPlayer && !user) {
    return (
      <>
        <LandingNav />
        <main style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--surface)' }}>
          {children}
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Usuario';

  const navUser = {
    name: displayName,
    email: user.email ?? '',
  };

  const plan = normalizePlan(profile?.plan);

  return (
    <SessionProvider user={user} profile={profile}>
      <AppNav user={navUser} plan={plan} />
      {plan === 'free' && pathname !== '/profile' && <UpgradeBanner />}
      <main style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--surface)' }}>
        {children}
      </main>
    </SessionProvider>
  );
}
