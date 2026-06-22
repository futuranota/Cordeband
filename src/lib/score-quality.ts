import type { InstrumentKey, ScoreNote } from '@/lib/data';

export type ScoreQuality = 'high' | 'medium' | 'draft' | 'unavailable';

/** Whether this transcription is reliable enough to show without an AI caveat overlay. */
export type TranscriptionTrust = 'trusted' | 'uncertain' | 'unavailable' | 'none';

export const INSTRUMENT_QUALITY: Record<InstrumentKey, ScoreQuality> = {
  bass: 'high',
  guitar: 'medium',
  piano: 'medium',
  drums: 'unavailable',
  other: 'draft',
  vocals: 'draft',
};

const CONFIDENCE_NOTE_THRESHOLD = 0.5;

type TrustThresholds = { avg: number; ratio: number; minNotes: number };

const TRUST_THRESHOLDS: Record<Exclude<ScoreQuality, 'unavailable'>, TrustThresholds> = {
  high: { avg: 0.48, ratio: 0.42, minNotes: 4 },
  medium: { avg: 0.54, ratio: 0.48, minNotes: 6 },
  draft: { avg: 0.68, ratio: 0.62, minNotes: 10 },
};

export type ConfidenceStats = {
  count: number;
  avg: number | null;
  highRatio: number | null;
};

export function computeConfidenceStats(
  notes: readonly Pick<ScoreNote, 'confidence'>[],
): ConfidenceStats {
  const vals = notes
    .map((n) => n.confidence)
    .filter((c): c is number => typeof c === 'number' && Number.isFinite(c));

  if (!vals.length) {
    return { count: notes.length, avg: null, highRatio: null };
  }

  const highCount = vals.filter((c) => c >= CONFIDENCE_NOTE_THRESHOLD).length;
  return {
    count: notes.length,
    avg: vals.reduce((sum, c) => sum + c, 0) / vals.length,
    highRatio: highCount / vals.length,
  };
}

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

function isUserProvidedScore(notes: readonly Pick<ScoreNote, 'source'>[]): boolean {
  const source = notes.find((n) => n.source)?.source;
  return source === 'user_midi' || source === 'user_upload';
}

function passesTrustThresholds(
  baseline: Exclude<ScoreQuality, 'unavailable'>,
  stats: ConfidenceStats,
): boolean {
  const { avg, ratio, minNotes } = TRUST_THRESHOLDS[baseline];
  if (stats.count < minNotes) return false;
  if (stats.avg == null || stats.highRatio == null) return false;
  return stats.avg >= avg && stats.highRatio >= ratio;
}

/**
 * Per-song trust: uses Basic Pitch per-note confidence when available.
 * Trusted scores skip the glass / watermark overlay in the player.
 */
export function resolveTranscriptionTrust(
  instrument: InstrumentKey,
  notes: readonly (Pick<ScoreNote, 'quality' | 'confidence' | 'source'>)[] = [],
): TranscriptionTrust {
  const baseline = resolveScoreQuality(instrument, notes);

  if (baseline === 'unavailable') return 'unavailable';
  if (!notes.length) return 'none';
  if (isUserProvidedScore(notes)) return 'trusted';

  const stats = computeConfidenceStats(notes);

  // No confidence metadata (legacy rows): fall back to instrument baseline only.
  if (stats.avg == null) {
    return baseline === 'high' ? 'trusted' : 'uncertain';
  }

  return passesTrustThresholds(baseline, stats) ? 'trusted' : 'uncertain';
}

export function shouldShowAiCaveat(
  instrument: InstrumentKey,
  notes: readonly (Pick<ScoreNote, 'quality' | 'confidence' | 'source'>)[] = [],
): boolean {
  return resolveTranscriptionTrust(instrument, notes) === 'uncertain';
}

export function instrumentQualityLabelKey(instrument: InstrumentKey): string {
  const q = INSTRUMENT_QUALITY[instrument];
  if (q === 'high') return 'scoreQuality.high';
  if (q === 'medium') return 'scoreQuality.medium';
  if (q === 'unavailable') return 'scoreQuality.unavailable';
  return 'scoreQuality.draft';
}
