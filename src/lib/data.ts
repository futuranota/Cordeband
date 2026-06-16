import { InstGuitar, InstPiano, InstBass, InstDrums, InstVocals, InstOther } from '@/components/ui/icons';
import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

export type InstrumentKey = 'guitar' | 'piano' | 'bass' | 'drums' | 'vocals' | 'other';

export type Instrument = {
  key: InstrumentKey;
  name: string;
  Icon: ComponentType<IconProps>;
};

export const INSTRUMENTS: Record<InstrumentKey, Instrument> = {
  guitar: { key: 'guitar', name: 'Guitarra', Icon: InstGuitar },
  piano:  { key: 'piano',  name: 'Piano',    Icon: InstPiano  },
  bass:   { key: 'bass',   name: 'Bajo',     Icon: InstBass   },
  drums:  { key: 'drums',  name: 'Batería',  Icon: InstDrums  },
  vocals: { key: 'vocals', name: 'Voz',      Icon: InstVocals },
  other:  { key: 'other',  name: 'Otros',    Icon: InstOther  },
};

export const INST_ORDER: InstrumentKey[] = ['guitar', 'piano', 'bass', 'drums', 'vocals', 'other'];

export type Song = {
  id: string;
  title: string;
  artist: string;
  instruments: InstrumentKey[];
  duration: number;
  bpm: number;
  keySig: string;
  added: string;
  glyph: string;
  stemsExpiresAt: number | null;
  addedThisMonth: boolean;
  featured?: boolean;
  published?: boolean;
  isFeatured?: boolean;
};

const NOW = Date.now();
const H = 3600 * 1000;

export const LIBRARY: Song[] = [
  { id: 's1', title: 'Las Luces de Enero', artist: 'Mariana Velasco',
    instruments: ['guitar', 'vocals', 'drums', 'bass', 'piano'], duration: 222,
    bpm: 88, keySig: 'La menor', added: 'hace 2 días', glyph: '♪',
    stemsExpiresAt: NOW + 38 * H, addedThisMonth: false },
  { id: 's2', title: 'Cielo Partido', artist: 'El Último Vagón',
    instruments: ['guitar', 'vocals', 'drums', 'bass'], duration: 245,
    bpm: 120, keySig: 'Mi menor', added: 'hace 5 días', glyph: '♫',
    stemsExpiresAt: NOW - 2 * H, addedThisMonth: false },
  { id: 's3', title: 'Verano en Reversa', artist: 'Joaquín Sabater',
    instruments: ['guitar', 'vocals', 'drums', 'piano'], duration: 198,
    bpm: 96, keySig: 'Sol mayor', added: 'la semana pasada', glyph: '♩',
    stemsExpiresAt: NOW + 5 * H, addedThisMonth: false },
];

export const DEFAULT_FEATURED: Song[] = [
  { id: 'f1', title: 'Río de Neon', artist: 'Cordeband Sessions',
    instruments: ['guitar', 'vocals', 'drums', 'bass', 'piano'], duration: 208,
    bpm: 102, keySig: 'Do mayor', glyph: '♬', featured: true, published: true,
    stemsExpiresAt: null, addedThisMonth: false, added: '' },
  { id: 'f2', title: 'Madrugada', artist: 'Cordeband Sessions',
    instruments: ['guitar', 'piano', 'bass', 'drums'], duration: 176,
    bpm: 78, keySig: 'Re menor', glyph: '♪', featured: true, published: true,
    stemsExpiresAt: null, addedThisMonth: false, added: '' },
  { id: 'f3', title: 'Carretera Abierta', artist: 'Cordeband Sessions',
    instruments: ['guitar', 'vocals', 'drums', 'bass'], duration: 231,
    bpm: 128, keySig: 'La mayor', glyph: '♫', featured: true, published: false,
    stemsExpiresAt: null, addedThisMonth: false, added: '' },
];

export type StemTrack = {
  key: InstrumentKey;
  name: string;
  Icon: ComponentType<IconProps>;
  def: number;
};

export const STEMS: StemTrack[] = [
  { key: 'vocals', name: 'Voz',      Icon: InstVocals, def: 78 },
  { key: 'drums',  name: 'Batería',  Icon: InstDrums,  def: 82 },
  { key: 'bass',   name: 'Bajo',     Icon: InstBass,   def: 80 },
  { key: 'piano',  name: 'Piano',    Icon: InstPiano,  def: 70 },
  { key: 'guitar', name: 'Guitarra', Icon: InstGuitar, def: 0  },
];

/* ── Stem TTL helpers ─────────────────────────────────────── */
export function stemsMsLeft(song: Song): number {
  if (!song || song.stemsExpiresAt == null) return Infinity;
  return song.stemsExpiresAt - Date.now();
}

export function stemsExpired(song: Song): boolean {
  return stemsMsLeft(song) <= 0;
}

/* ── Format helpers ───────────────────────────────────────── */
export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ── Featured songs (localStorage fallback for now) ──────── */
const FEAT_LS = 'cordeband_featured_v1';

export function loadFeatured(): Song[] {
  if (typeof window === 'undefined') return DEFAULT_FEATURED;
  try {
    const raw = localStorage.getItem(FEAT_LS);
    if (raw) return JSON.parse(raw) as Song[];
  } catch { /* ignore */ }
  return DEFAULT_FEATURED;
}

export function saveFeatured(list: Song[]): void {
  try { localStorage.setItem(FEAT_LS, JSON.stringify(list)); } catch { /* ignore */ }
}

export function publishedFeatured(): Song[] {
  return loadFeatured()
    .filter((s) => s.published)
    .map((s) => ({ ...s, stemsExpiresAt: null, isFeatured: true }));
}

/* ── Admin affiliates (localStorage for now) ─────────────── */
export type AffiliateProduct = {
  id: string;
  title: string;
  price: string;
  url: string;
  image?: string;
  platform: string;
  instrument: string;
  active?: boolean;
};

const AFF_LS = 'cordeband_affiliates_v1';

export function loadAdminAffiliates(): AffiliateProduct[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(AFF_LS) ?? '[]') as AffiliateProduct[]; }
  catch { return []; }
}

export function saveAdminAffiliates(list: AffiliateProduct[]): void {
  try { localStorage.setItem(AFF_LS, JSON.stringify(list)); } catch { /* ignore */ }
}

export function getAffiliates(instrument: string): AffiliateProduct[] {
  const admin = loadAdminAffiliates().filter((a) => a.active !== false);
  return admin.filter((a) => a.instrument === instrument || a.instrument === 'all');
}
