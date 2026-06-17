import { PlayerScreen } from '@/components/screens/PlayerScreen';
import { createClient } from '@/lib/supabase/server';
import { getProfile, normalizePlan } from '@/lib/supabase/profile';
import { defaultPlayerMode } from '@/lib/plan-access';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reproductor — Cordeband' };

type PlayerPageProps = {
  searchParams: Promise<{ demo?: string }>;
};

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const plan = normalizePlan(profile?.plan);

  const initialDemoMode = defaultPlayerMode({
    isDemo: !user,
    plan,
    urlDemo: params.demo ?? null,
  });

  return <PlayerScreen initialDemoMode={initialDemoMode} />;
}
