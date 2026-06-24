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
  coverUrl?: string;
  isAiGenerated?: boolean;
  description?: string;
  status?: string;
  midi_filename?: string | null;
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
  { key: 'guitar', name: 'Guitarra', Icon: InstGuitar, def: 76 },
  { key: 'other',  name: 'Otros',    Icon: InstOther,  def: 64 },
];

export function stemTracksFor(keys: InstrumentKey[]): StemTrack[] {
  const set = new Set(keys);
  return INST_ORDER.filter((k) => set.has(k)).map(
    (k) => STEMS.find((s) => s.key === k) ?? {
      key: k,
      name: INSTRUMENTS[k].name,
      Icon: INSTRUMENTS[k].Icon,
      def: 70,
    },
  );
}

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
  const matched = admin.filter((a) => a.instrument === instrument || a.instrument === 'all');
  if (matched.length) return matched;
  return DEFAULT_AFFILIATES[instrument] ?? DEFAULT_AFFILIATES.guitar ?? [];
}

/* ── Score data for sheet viewer ──────────────────────────── */
const TUNING = [64, 59, 55, 50, 45, 40];

function diatonicIndex(midi: number) {
  const pcMap: Record<number, number> = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6 };
  return Math.floor(midi / 12) * 7 + pcMap[midi % 12];
}

export function staffPos(midi: number) {
  return diatonicIndex(midi) - diatonicIndex(64);
}

export function midiToTab(midi: number) {
  let best: { string: number; fret: number } | null = null;
  for (let s = 0; s < TUNING.length; s++) {
    const fret = midi - TUNING[s];
    if (fret < 0 || fret > 15) continue;
    if (best === null || fret < best.fret) best = { string: s, fret };
  }
  if (!best) best = { string: 0, fret: Math.max(0, midi - 64) };
  return best;
}

export type ScoreNote = {
  beat: number;
  dur: number;
  midi: number;
  s: number;
  tab: { string: number; fret: number };
  /** Segundos de audio — pipeline v2 / migración DB */
  startTime?: number | null;
  endTime?: number | null;
  confidence?: number | null;
  source?: string | null;
  quality?: 'high' | 'medium' | 'draft' | 'unavailable' | null;
};

const E = 64, G = 67, A4 = 69, B4 = 71, C5 = 72, D = 62, C = 60, F = 65;
const PHRASES: [number, number][][] = [
  [[E, 1], [G, 1], [A4, 1], [B4, 1], [C5, 2], [B4, 1], [A4, 1]],
  [[G, 1.5], [A4, 0.5], [B4, 1], [A4, 1], [G, 2], [E, 1], [D, 1]],
  [[C, 1], [E, 1], [G, 1], [E, 1], [A4, 2], [G, 1], [F, 1]],
  [[E, 2], [D, 1], [C, 1], [D, 1.5], [E, 0.5], [G, 1], [E, 1]],
  [[A4, 1], [C5, 1], [B4, 1], [A4, 1], [G, 1], [E, 1], [D, 2]],
  [[C, 2], [D, 1], [E, 1], [F, 1], [E, 1], [D, 1], [C, 1]],
];

function buildScore() {
  const notes: ScoreNote[] = [];
  let beat = 0;
  const plan = [0, 1, 2, 3, 0, 1, 4, 5, 2, 3, 4, 5, 0, 2, 1, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 0, 5, 4, 1, 2, 3];
  plan.forEach((pi) => {
    PHRASES[pi].forEach(([m, dur]) => {
      if (m !== 0) {
        notes.push({ beat, dur, midi: m, s: staffPos(m), tab: midiToTab(m) });
      }
      beat += dur;
    });
  });
  return { notes, totalBeats: beat };
}

export const SCORE = buildScore();

const DEFAULT_AFFILIATES: Record<string, AffiliateProduct[]> = {
  guitar: [
    { id: 'g1', title: 'Cuerdas Elixir Nanoweb', price: '$14.99', url: '#', platform: 'Amazon', instrument: 'guitar' },
    { id: 'g2', title: 'Capo Kyser Quick-Change', price: '$19.95', url: '#', platform: 'Sweetwater', instrument: 'guitar' },
  ],
  piano: [
    { id: 'p1', title: 'Sustain pedal M-Audio', price: '$29.99', url: '#', platform: 'Amazon', instrument: 'piano' },
  ],
  bass: [
    { id: 'b1', title: 'Cuerdas Ernie Ball Slinky Bass', price: '$24.99', url: '#', platform: 'Amazon', instrument: 'bass' },
  ],
  drums: [
    { id: 'd1', title: 'Baquetas Vic Firth 5A', price: '$11.99', url: '#', platform: 'Amazon', instrument: 'drums' },
  ],
  vocals: [
    { id: 'v1', title: 'Micrófono Shure SM58', price: '$99.00', url: '#', platform: 'Sweetwater', instrument: 'vocals' },
  ],
  other: [],
};
