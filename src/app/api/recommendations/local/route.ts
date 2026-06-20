import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/profile';
import { createAdminClient } from '@/lib/supabase/admin';
import { matchesUserLocation } from '@/lib/location';
import type { LocalBusiness } from '@/types/database';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile?.city && !profile?.postal_code) {
    return NextResponse.json({ businesses: [] });
  }

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from('local_businesses')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const businesses = ((data ?? []) as LocalBusiness[]).filter((biz) =>
    matchesUserLocation(profile.city, profile.postal_code, biz.city, biz.postal_code),
  );

  return NextResponse.json({ businesses });
}
