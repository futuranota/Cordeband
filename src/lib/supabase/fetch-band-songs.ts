import type { Song } from '@/lib/data';
import { fetchPublishedCatalogSongs } from '@/lib/supabase/fetch-published-catalog';
import { fetchUserLibrarySongs } from '@/lib/supabase/fetch-user-library';
import { readActiveSongId } from '@/lib/supabase/fetch-song';

export async function fetchBandEligibleSongs(): Promise<Song[]> {
  const [userSongs, catalogSongs] = await Promise.all([
    fetchUserLibrarySongs(),
    fetchPublishedCatalogSongs(),
  ]);

  const ready = [...userSongs, ...catalogSongs].filter((s) => s.status === 'ready');
  const seen = new Set<string>();
  const deduped: Song[] = [];
  for (const song of ready) {
    if (seen.has(song.id)) continue;
    seen.add(song.id);
    deduped.push(song);
  }
  return deduped;
}

export function pickDefaultBandSongId(songs: Song[]): string | null {
  if (!songs.length) return null;
  const lastActive = readActiveSongId();
  if (lastActive && songs.some((s) => s.id === lastActive)) return lastActive;
  return songs[0].id;
}
