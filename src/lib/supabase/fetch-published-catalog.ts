import { createClient } from '@/lib/supabase/client';
import { mapCatalogRowToSong, PUBLISHED_CATALOG_SELECT } from '@/lib/supabase/catalog-songs';
import type { Song } from '@/lib/data';
import type { CatalogSongRow } from '@/types/catalog';

export async function fetchPublishedCatalogSongs(): Promise<Song[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('songs')
    .select(PUBLISHED_CATALOG_SELECT)
    .eq('is_featured', true)
    .eq('is_public', true)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CatalogSongRow[]).map(mapCatalogRowToSong);
}
