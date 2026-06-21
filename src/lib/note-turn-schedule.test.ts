import { describe, expect, it } from 'vitest';
import type { ScoreNote } from '@/lib/data';
import { viewerPartStatus } from '@/lib/band-schedule';
import { isYourTurnAt, windowsFromNotes } from '@/lib/note-turn-schedule';

function note(beat: number, dur: number): ScoreNote {
  return { beat, dur, midi: 64, s: 0, tab: { string: 0, fret: 0 } };
}

describe('windowsFromNotes', () => {
  it('returns empty for no notes', () => {
    expect(windowsFromNotes([])).toEqual([]);
  });

  it('merges notes within gap threshold into one window', () => {
    const notes = [note(10, 1), note(11.5, 1), note(13, 2)];
    const wins = windowsFromNotes(notes, { gapBeats: 2, padBeats: 0 });
    expect(wins).toEqual([{ startBeat: 10, endBeat: 15 }]);
  });

  it('splits on gaps larger than threshold', () => {
    const notes = [
      note(10, 2),
      note(20, 2),
      note(22, 1),
    ];
    const wins = windowsFromNotes(notes, { gapBeats: 2, padBeats: 0, minSegmentBeats: 0.5 });
    expect(wins).toHaveLength(2);
    expect(wins[0]).toEqual({ startBeat: 10, endBeat: 12 });
    expect(wins[1]).toEqual({ startBeat: 20, endBeat: 23 });
  });

  it('applies pad beats around segments', () => {
    const wins = windowsFromNotes([note(10, 2)], { padBeats: 0.5 });
    expect(wins[0]).toEqual({ startBeat: 9.5, endBeat: 12.5 });
  });
});

describe('isYourTurnAt', () => {
  const windows = windowsFromNotes(
    [note(10, 2), note(30, 3)],
    { gapBeats: 2, padBeats: 0 },
  );

  it('is true inside a window', () => {
    expect(isYourTurnAt(11, windows)).toBe(true);
    expect(isYourTurnAt(31, windows)).toBe(true);
  });

  it('is false in gaps between windows', () => {
    expect(isYourTurnAt(20, windows)).toBe(false);
  });
});

describe('viewerPartStatus with note windows', () => {
  const windows = windowsFromNotes(
    [note(20, 4), note(50, 4)],
    { gapBeats: 2, padBeats: 0 },
  );

  it('returns live during a note segment', () => {
    expect(viewerPartStatus(22, windows).status).toBe('live');
  });

  it('returns waiting between segments', () => {
    expect(viewerPartStatus(10, windows).status).toBe('waiting');
  });

  it('returns ready near next segment', () => {
    expect(viewerPartStatus(14, windows, 8).status).toBe('ready');
  });
});
