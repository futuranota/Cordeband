import { describe, expect, it } from 'vitest';
import { notesToAlphaTex } from '@/lib/alphatab/notes-to-alphatex';
import type { ScoreNote } from '@/lib/data';

const sampleNote: ScoreNote = {
  beat: 0,
  dur: 1,
  midi: 64,
  s: 0,
  tab: { string: 0, fret: 0 },
};

describe('notesToAlphaTex', () => {
  it('uses \\instrument metadata for piano', () => {
    const tex = notesToAlphaTex('Test', 120, 'piano', [sampleNote]);
    expect(tex).toContain('\\instrument 0');
    expect(tex).not.toMatch(/\\track "[^"]+" instrument /);
    expect(tex).not.toMatch(/\n\.\n/);
  });

  it('uses percussion syntax for drums', () => {
    const tex = notesToAlphaTex('Test', 120, 'drums', [{ ...sampleNote, midi: 36 }]);
    expect(tex).toContain('\\instrument percussion');
    expect(tex).toContain('\\clef neutral');
    expect(tex).toContain('\\articulation defaults');
    expect(tex).toContain('KickHit');
    expect(tex).not.toContain('instrument 128');
  });

  it('maps melodic midi on drums to articulations', () => {
    const tex = notesToAlphaTex('Test', 120, 'drums', [sampleNote]);
    expect(tex).toContain('HiHatClosed');
  });

  it('uses score tabs staff syntax for guitar', () => {
    const tex = notesToAlphaTex('Test', 120, 'guitar', [sampleNote]);
    expect(tex).toContain('\\staff {score tabs}');
    expect(tex).not.toContain('standard');
  });

  it('maps bass notes to 4-string tab range', () => {
    const notes = [
      { ...sampleNote, midi: 40, beat: 0 },
      { ...sampleNote, midi: 48, beat: 1 },
      { ...sampleNote, midi: 55, beat: 2 },
    ];
    const tex = notesToAlphaTex('Test', 120, 'bass', notes)!;
    expect(tex).toContain('\\tuning (E1 A1 D2 G2)');
    // AlphaTex tab format is fret.string — string must stay 1-4 for bass
    expect(tex).not.toMatch(/\.\d*[5-9]\b/);
    expect(tex).toMatch(/\.\d*[1-4]\b/);
  });

  it('ignores 1-indexed guitar tab in DB and stays within 1-6', () => {
    const notes = [
      { ...sampleNote, midi: 64, tab: { string: 6, fret: 3 } },
      { ...sampleNote, midi: 59, beat: 1, tab: { string: 5, fret: 0 } },
    ];
    const tex = notesToAlphaTex('Test', 120, 'guitar', notes)!;
    // fret.string — reject string 0 or 7+
    expect(tex).not.toMatch(/\.\d*0\b/);
    expect(tex).not.toMatch(/\.\d*[7-9]\b/);
    expect(tex).toMatch(/\.\d*[1-6]\b/);
  });

  it('derives guitar tab from midi regardless of stored tab string', () => {
    const note = { ...sampleNote, midi: 64, tab: { string: 99, fret: 99 } };
    const tex = notesToAlphaTex('Test', 120, 'guitar', [note])!;
    expect(tex).not.toMatch(/\.\d*99\b/);
    expect(tex).toMatch(/\.\d*[1-6]\b/);
  });

  it('emits AlphaTex fret.string order (not string.fret)', () => {
    // midi 64 = open high E → string 6 in AlphaTab numbering from our mapper
    const tex = notesToAlphaTex('Test', 120, 'guitar', [sampleNote])!;
    expect(tex).toMatch(/\b0\.[1-6]\b/);
    expect(tex).not.toMatch(/\b[1-6]\.0\b/);
  });
});
