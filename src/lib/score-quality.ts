import type { InstrumentKey, ScoreNote } from '@/lib/data';

export type ScoreQuality = 'high' | 'medium' | 'draft' | 'unavailable';

export const INSTRUMENT_QUALITY: Record<InstrumentKey, ScoreQuality> = {
  bass: 'high',
  guitar: 'medium',
  piano: 'medium',
  drums: 'unavailable',
  other: 'draft',
  vocals: 'draft',
};

export function resolveScoreQuality(
  instrument: InstrumentKey,
  notes: readonly Pick<ScoreNote, 'quality'>[] = [],
): ScoreQuality {
  const fromNote = notes.find((n) => n.quality)?.quality;
  if (fromNote === 'high' || fromNote === 'medium' || fromNote === 'draft' || fromNote === 'unavailable') {
    return fromNote;
  }
  return INSTRUMENT_QUALITY[instrument] ?? 'draft';
}

export function isScoreUnavailable(instrument: InstrumentKey, notes: readonly Pick<ScoreNote, 'quality'>[] = []): boolean {
  return resolveScoreQuality(instrument, notes) === 'unavailable';
}
