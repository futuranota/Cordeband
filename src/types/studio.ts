export type StudioMode = 'demo' | 'live';

export interface StudioSectionProps {
  mode: StudioMode;
  initialCredits?: number;
  plan?: string;
}

export type StemKey = 'guitar' | 'piano' | 'bass' | 'drums';

export interface StemOption {
  stem: StemKey;
  label: string;
}

export interface StudioCompositionRequest {
  genre: string | null;
  stems: StemOption[];
  description: string;
}

export interface SongStructurePart {
  parte: string;
  descripcion: string;
}

export interface StudioCompositionResult {
  titulo: string;
  estructura: SongStructurePart[];
  letra: string;
  suno_prompt: string;
}

export interface StudioApiResponse {
  success: boolean;
  data?: StudioCompositionResult;
  creditsRemaining?: number;
  error?: string;
}

export type CreditAction = 'stem_separation' | 'studio_compose' | 'studio_compose_refund';

export type StudioStep = 0 | 1 | 2 | 3 | 4 | 5;

export type StudioFlowStepId =
  | 'intro'
  | 'genre'
  | 'instrument'
  | 'compose'
  | 'suno'
  | 'upload'
  | 'practice';

export type StudioView = 'intro' | 'create' | 'loading' | 'work' | 'error';

export interface StudioStructureRow {
  tag: string;
  cls: string;
  desc: string;
}

export interface StudioSong {
  id: string;
  title: string;
  genre: string | null;
  genreName: string | null;
  stems: StemKey[];
  prompt: string;
  bpm: number;
  keySig: string;
  instrumental: boolean;
  structure: StudioStructureRow[];
  lyricsText: string;
  sunoPrompt: string;
  createdAt: number;
}
