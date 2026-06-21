import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidSongUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export async function assertHostCanUseSong(
  supabase: SupabaseClient,
  userId: string,
  songId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('songs')
    .select('id')
    .eq('id', songId)
    .eq('status', 'ready')
    .or(`user_id.eq.${userId},is_featured.eq.true`)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Song not found or not available for band');
  }
}
