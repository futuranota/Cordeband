import type { StemKey, StudioCompositionResult, StudioMode, StudioSong, StudioStructureRow } from '@/types/studio';

const LS_DEMO = 'cordeband_studio_demo_songs_v1';
const LS_LIVE = 'cordeband_studio_songs_v1';

const GENRE_BPM: Record<string, number> = {
  Pop: 108,
  'R&B / Soul': 92,
  'Hip-hop / Trap': 88,
  'Lo-fi / Electrónica': 78,
  'Rock / Indie': 128,
  'Jazz / Bossa': 96,
  'Reggaeton / Urbano': 94,
  'Clásico / Instrumental': 84,
};

const GENRE_KEY: Record<string, string> = {
  Pop: 'C mayor',
  'R&B / Soul': 'Eb mayor',
  'Hip-hop / Trap': 'F menor',
  'Lo-fi / Electrónica': 'Am',
  'Rock / Indie': 'E mayor',
  'Jazz / Bossa': 'Bb mayor',
  'Reggaeton / Urbano': 'Dm',
  'Clásico / Instrumental': 'D mayor',
};

export function songsStorageKey(mode: StudioMode): string {
  return mode === 'demo' ? LS_DEMO : LS_LIVE;
}

export function readSongs(key: string): StudioSong[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StudioSong[]) : [];
  } catch {
    return [];
  }
}

export function writeSongs(key: string, songs: StudioSong[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(songs));
}

export function structClassFromParte(parte: string): string {
  const p = parte.toLowerCase();
  if (p.includes('intro')) return 'st-intro';
  if (p.includes('coro')) return 'st-coro';
  if (p.includes('pre')) return 'st-pre';
  if (p.includes('puente')) return 'st-puente';
  if (p.includes('outro')) return 'st-outro';
  return 'st-verso';
}

export function mapStructure(estructura: StudioCompositionResult['estructura']): StudioStructureRow[] {
  return estructura.map((row) => ({
    tag: row.parte,
    cls: structClassFromParte(row.parte),
    desc: row.descripcion,
  }));
}

export function isInstrumentalGenre(genre: string | null): boolean {
  return genre === 'Clásico / Instrumental';
}

interface SongMeta {
  genre: string | null;
  genreName: string | null;
  stems: StemKey[];
  prompt: string;
}

export function apiResultToSong(data: StudioCompositionResult, meta: SongMeta): StudioSong {
  const bpm = meta.genre ? (GENRE_BPM[meta.genre] ?? 108) : 108;
  const keySig = meta.genre ? (GENRE_KEY[meta.genre] ?? 'Am') : 'Am';
  return {
    id: `s-${Date.now()}`,
    title: data.titulo,
    genre: meta.genre,
    genreName: meta.genreName,
    stems: meta.stems,
    prompt: meta.prompt,
    bpm,
    keySig,
    instrumental: isInstrumentalGenre(meta.genre),
    structure: mapStructure(data.estructura),
    lyricsText: data.letra,
    sunoPrompt: data.suno_prompt,
    createdAt: Date.now(),
  };
}
