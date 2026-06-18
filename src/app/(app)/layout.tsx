import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-auth';
import { getProfile } from '@/lib/supabase/profile';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const isAdmin = user ? isAdminUser(user.id) : false;

  return (
    <AppShell user={user} profile={profile} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
