import { createClient } from '@/lib/supabase/client';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';

export type HostBandRoomSong = {
  id: string;
  title: string;
  artist: string;
  glyph: string;
};

export type HostBandRoom = BandRoomRecord & {
  songs: HostBandRoomSong | HostBandRoomSong[] | null;
  band_members: BandMemberRecord[];
};

export async function fetchHostBandRooms(userId: string): Promise<HostBandRoom[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('band_rooms')
    .select(`
      id, code, host_id, song_id, status, play_started_at, tempo, created_at, expires_at,
      songs ( id, title, artist, glyph ),
      band_members (
        id, room_id, user_id, guest_name, instrument, is_leader, status, joined_at,
        profiles ( full_name )
      )
    `)
    .eq('host_id', userId)
    .neq('status', 'ended')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as unknown) as HostBandRoom[];
}

export function hostBandRoomSong(room: HostBandRoom): HostBandRoomSong | null {
  if (!room.songs) return null;
  return Array.isArray(room.songs) ? room.songs[0] ?? null : room.songs;
}
