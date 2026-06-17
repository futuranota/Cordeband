import { createClient } from '@supabase/supabase-js';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function lookupBandRoomByToken(token: string): Promise<{
  room: BandRoomRecord;
  members: Pick<BandMemberRecord, 'instrument' | 'guest_name' | 'user_id' | 'profiles'>[];
} | null> {
  const admin = createAdminClient();
  const normalized = decodeURIComponent(token).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);

  let query = admin.from('band_rooms').select('*');
  query = isUuid ? query.eq('id', normalized) : query.eq('code', normalized.toUpperCase());

  const { data: room, error } = await query.single();
  if (error || !room) return null;

  const { data: members } = await admin
    .from('band_members')
    .select('instrument, guest_name, user_id, profiles(full_name)')
    .eq('room_id', room.id)
    .neq('status', 'disconnected');

  return {
    room: room as BandRoomRecord,
    members: (members ?? []) as unknown as Pick<BandMemberRecord, 'instrument' | 'guest_name' | 'user_id' | 'profiles'>[],
  };
}
