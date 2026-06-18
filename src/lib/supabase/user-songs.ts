import type { InstrumentKey, Song } from '@/lib/data';

export type UserSongRow = {
  id: string;
  title: string;
  artist: string;
  glyph: string;
  duration_seconds: number;
  bpm: number | null;
  key_signature: string | null;
  instruments: string[];
  status: string;
  stems_expires_at: string | null;
  added_this_month: boolean;
  created_at: string;
};

function asInstruments(raw: string[]): InstrumentKey[] {
  const allowed: InstrumentKey[] = ['guitar', 'piano', 'bass', 'drums', 'vocals', 'other'];
  return raw.filter((k): k is InstrumentKey => allowed.includes(k as InstrumentKey));
}

export function formatSongAddedLabel(createdAt: string, locale: 'es' | 'en' = 'es'): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return locale === 'es' ? 'hoy' : 'today';
  if (days === 1) return locale === 'es' ? 'ayer' : 'yesterday';
  if (days < 7) {
    return locale === 'es' ? `hace ${days} días` : `${days} days ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return locale === 'es' ? 'la semana pasada' : 'last week';
  return locale === 'es' ? `hace ${weeks} semanas` : `${weeks} weeks ago`;
}

export function mapUserSongRowToSong(row: UserSongRow, locale: 'es' | 'en' = 'es'): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    glyph: row.glyph,
    instruments: asInstruments(row.instruments),
    duration: row.duration_seconds,
    bpm: row.bpm ?? 0,
    keySig: row.key_signature ?? '',
    added: formatSongAddedLabel(row.created_at, locale),
    stemsExpiresAt: row.stems_expires_at ? new Date(row.stems_expires_at).getTime() : null,
    addedThisMonth: row.added_this_month,
    status: row.status,
  };
}

export const USER_SONG_SELECT =
  'id, title, artist, glyph, duration_seconds, bpm, key_signature, instruments, status, stems_expires_at, added_this_month, created_at';
