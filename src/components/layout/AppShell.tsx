'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { AppNav } from '@/components/layout/AppNav';
import { LandingNav } from '@/components/layout/LandingNav';
import { UpgradeBanner } from '@/components/billing/UpgradeBanner';
import { SessionProvider } from '@/contexts/SessionContext';
import type { Profile } from '@/types/database';
import { normalizePlan } from '@/lib/supabase/profile';
import { ADMIN_EFFECTIVE_PLAN } from '@/lib/admin-privileges';

type AppShellProps = {
  user: User | null;
  profile: Profile | null;
  isAdmin?: boolean;
  children: React.ReactNode;
};

export function AppShell({ user, profile, isAdmin = false, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDemoPlayer = pathname === '/player';

  useEffect(() => {
    if (!user && !isDemoPlayer) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, isDemoPlayer, pathname, router]);

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
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)' }} aria-busy="true" />
    );
  }

  const isStudioPage = pathname === '/studio';

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Usuario';

  const navUser = {
    name: displayName,
    email: user.email ?? '',
  };

  const plan = isAdmin ? ADMIN_EFFECTIVE_PLAN : normalizePlan(profile?.plan);

  return (
    <SessionProvider user={user} profile={profile} isAdmin={isAdmin}>
      {!isStudioPage && <AppNav user={navUser} plan={plan} isAdmin={isAdmin} />}
      {!isAdmin && plan === 'free' && pathname !== '/profile' && !isStudioPage && <UpgradeBanner />}
      <main style={{ minHeight: isStudioPage ? '100vh' : 'calc(100vh - 68px)', background: isStudioPage ? 'transparent' : 'var(--surface)' }}>
        {children}
      </main>
    </SessionProvider>
  );
}
