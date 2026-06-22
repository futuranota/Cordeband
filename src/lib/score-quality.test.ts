import { describe, expect, it } from 'vitest';
import {
  computeConfidenceStats,
  resolveTranscriptionTrust,
  shouldShowAiCaveat,
} from '@/lib/score-quality';
import type { ScoreNote } from '@/lib/data';

function note(partial: Partial<ScoreNote> & Pick<ScoreNote, 'confidence'>): ScoreNote {
  return {
    beat: 0,
    dur: 1,
    midi: 64,
    s: 0,
    tab: { string: 0, fret: 0 },
    quality: 'medium',
    source: 'ai_basic_pitch',
    ...partial,
  };
}

describe('resolveTranscriptionTrust', () => {
  it('trusts bass with strong Basic Pitch confidence', () => {
    const notes = Array.from({ length: 12 }, (_, i) =>
      note({ beat: i, confidence: 0.78, quality: 'high' }),
    );
    expect(resolveTranscriptionTrust('bass', notes)).toBe('trusted');
    expect(shouldShowAiCaveat('bass', notes)).toBe(false);
  });

  it('shows caveat for bass with weak confidence despite instrument tier', () => {
    const notes = Array.from({ length: 12 }, (_, i) =>
      note({ beat: i, confidence: 0.25, quality: 'high' }),
    );
    expect(resolveTranscriptionTrust('bass', notes)).toBe('uncertain');
    expect(shouldShowAiCaveat('bass', notes)).toBe(true);
  });

  it('trusts guitar when confidence is high enough for medium tier', () => {
    const notes = Array.from({ length: 10 }, (_, i) =>
      note({ beat: i, confidence: 0.62, quality: 'medium' }),
    );
    expect(resolveTranscriptionTrust('guitar', notes)).toBe('trusted');
  });

  it('marks drums unavailable', () => {
    expect(resolveTranscriptionTrust('drums', [])).toBe('unavailable');
  });

  it('trusts user-provided midi without caveat', () => {
    const notes = [note({ confidence: 0.2, source: 'user_upload' })];
    expect(resolveTranscriptionTrust('guitar', notes)).toBe('trusted');
  });

  it('falls back to baseline when confidence is missing', () => {
    const notes = [{ beat: 0, dur: 1, midi: 43, s: 0, tab: { string: 0, fret: 0 }, quality: 'high' as const }];
    expect(resolveTranscriptionTrust('bass', notes)).toBe('trusted');
    expect(resolveTranscriptionTrust('guitar', [{ ...notes[0], quality: 'medium' }])).toBe('uncertain');
  });
});

describe('computeConfidenceStats', () => {
  it('computes avg and high ratio', () => {
    const stats = computeConfidenceStats([
      note({ confidence: 0.8 }),
      note({ confidence: 0.4 }),
      note({ confidence: 0.6 }),
    ]);
    expect(stats.count).toBe(3);
    expect(stats.avg).toBeCloseTo(0.6, 2);
    expect(stats.highRatio).toBeCloseTo(2 / 3, 2);
  });
});
