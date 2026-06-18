import type { InstrumentKey, Song } from '@/lib/data';
import type { CatalogSongRow } from '@/types/catalog';

function asInstruments(raw: string[]): InstrumentKey[] {
  const allowed: InstrumentKey[] = ['guitar', 'piano', 'bass', 'drums', 'vocals', 'other'];
  return raw.filter((k): k is InstrumentKey => allowed.includes(k as InstrumentKey));
}

export function mapCatalogRowToSong(row: CatalogSongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    glyph: row.glyph,
    instruments: asInstruments(row.instruments),
    duration: row.duration_seconds,
    bpm: row.bpm ?? 0,
    keySig: row.key_signature ?? '',
    added: '',
    stemsExpiresAt: null,
    addedThisMonth: false,
    featured: true,
    published: row.is_public,
    isFeatured: true,
    coverUrl: row.cover_url ?? undefined,
    isAiGenerated: row.is_ai_generated,
    description: row.description ?? undefined,
    status: row.status,
  };
}

export const PUBLISHED_CATALOG_SELECT =
  'id, title, artist, glyph, description, cover_url, is_ai_generated, duration_seconds, bpm, key_signature, instruments, status, is_public, is_featured, featured_storage_url, storage_path, created_at';

export const ADMIN_CATALOG_SELECT = `${PUBLISHED_CATALOG_SELECT}`;
