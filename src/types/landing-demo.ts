import type { InstrumentKey } from '@/lib/data';

export type LandingDemoStem = {
  instrument: InstrumentKey;
  url: string;
};

export type LandingDemoResponse = {
  song: {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    durationSeconds: number;
    instruments: InstrumentKey[];
    isAiGenerated: boolean;
  };
  stems: LandingDemoStem[];
  source: 'catalog' | 'static';
};
