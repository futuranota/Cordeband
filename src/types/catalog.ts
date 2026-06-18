import type { InstrumentKey } from '@/lib/data';

export type CatalogSongStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type CatalogSongRow = {
  id: string;
  title: string;
  artist: string;
  glyph: string;
  description: string | null;
  cover_url: string | null;
  is_ai_generated: boolean;
  duration_seconds: number;
  bpm: number | null;
  key_signature: string | null;
  instruments: string[];
  status: CatalogSongStatus;
  is_public: boolean;
  is_featured: boolean;
  featured_storage_url: string | null;
  storage_path: string | null;
  created_at: string;
};

export type ProcessingJobRow = {
  id: string;
  song_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_pct: number;
  error_message: string | null;
};

export type FeaturedSongFormPayload = {
  title: string;
  artist: string;
  description: string;
  isAiGenerated: boolean;
};

export const CATALOG_INSTRUMENTS: InstrumentKey[] = [
  'guitar', 'piano', 'bass', 'drums', 'vocals', 'other',
];
