import { createClient } from '@/lib/supabase/client';
import {
  mapUserSongRowToSong,
  USER_SONG_SELECT,
  type UserSongRow,
} from '@/lib/supabase/user-songs';
import type { Song } from '@/lib/data';

export async function fetchUserLibrarySongs(): Promise<Song[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('songs')
    .select(USER_SONG_SELECT)
    .eq('source_type', 'upload')
    .neq('status', 'failed')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as UserSongRow[]).map((row) => mapUserSongRowToSong(row));
}
