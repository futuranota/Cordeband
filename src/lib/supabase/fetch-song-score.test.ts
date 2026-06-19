import { describe, expect, it } from 'vitest';
import { buildScoreFromNotes } from '@/lib/supabase/fetch-song-score';

describe('buildScoreFromNotes basic pitch format', () => {
  it('converts startTime/duration/pitch to beats', () => {
    const score = buildScoreFromNotes(
      [{ startTime: 0, duration: 0.5, pitch: 64 }],
      120,
    );
    expect(score.fromDb).toBe(true);
    expect(score.notes[0]?.midi).toBe(64);
    expect(score.notes[0]?.beat).toBe(0);
    expect(score.notes[0]?.dur).toBe(1);
  });
});
