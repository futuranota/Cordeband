import { createClient } from '@/lib/supabase/client';
import { mapCatalogRowToSong, PUBLISHED_CATALOG_SELECT } from '@/lib/supabase/catalog-songs';
import { mapUserSongRowToSong, type UserSongRow } from '@/lib/supabase/user-songs';
import type { InstrumentKey, Song } from '@/lib/data';
import { normalizeInstrumentKeys } from '@/lib/parse-instruments';
import type { CatalogSongRow } from '@/types/catalog';

export const SONG_DETAIL_SELECT = PUBLISHED_CATALOG_SELECT;

function mapDetailRowToSong(row: CatalogSongRow & {
  stems_expires_at?: string | null;
  added_this_month?: boolean;
}): Song {
  if (row.is_featured) {
    return mapCatalogRowToSong(row);
  }
  return mapUserSongRowToSong(row as UserSongRow);
}

export async function fetchSongById(songId: string): Promise<Song | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('songs')
    .select(`${SONG_DETAIL_SELECT}, stems_expires_at, added_this_month`)
    .eq('id', songId)
    .single();

  if (error || !data) return null;
  return mapDetailRowToSong(data as CatalogSongRow & {
    stems_expires_at: string | null;
    added_this_month: boolean;
  });
}

export const ACTIVE_SONG_LS = 'cordeband_song_id';
export const INSTRUMENT_CONFIRMED_LS = 'cordeband_instrument_confirmed_for';

export function readActiveSongId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SONG_LS);
}

export function saveActiveSongId(songId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SONG_LS, songId);
}

export function readInstrumentConfirmedFor(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(INSTRUMENT_CONFIRMED_LS);
}

export function saveInstrumentConfirmedFor(songId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INSTRUMENT_CONFIRMED_LS, songId);
}

export async function fetchStemInstruments(songId: string): Promise<InstrumentKey[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('stems')
    .select('instrument_type')
    .eq('song_id', songId);

  if (error || !data?.length) return [];
  return normalizeInstrumentKeys(data.map((row) => row.instrument_type));
}
