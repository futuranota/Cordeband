import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import type { PlanId } from '@/lib/plans';

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export function shouldRedirectToProfilePending(profile: Profile | null): boolean {
  if (!profile) return false;
  return (
    profile.plan === 'free' &&
    (profile.intended_plan === 'pro' || profile.intended_plan === 'banda')
  );
}

export function normalizePlan(value: string | null | undefined): PlanId {
  if (value === 'pro' || value === 'banda') return value;
  return 'free';
}
