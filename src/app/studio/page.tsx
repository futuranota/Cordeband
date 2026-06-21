import { StudioSection } from '@/components/studio/StudioSection';
import { getProfile } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/server';

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <StudioSection mode="demo" initialCredits={1} plan="free" />;
  }

  const profile = await getProfile(supabase, user.id);

  if (profile && !profile.studio_onboarding_seen_at) {
    await supabase
      .from('profiles')
      .update({ studio_onboarding_seen_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  return (
    <StudioSection
      mode="live"
      initialCredits={profile?.credits_remaining ?? 0}
      plan={profile?.plan ?? 'free'}
    />
  );
}
