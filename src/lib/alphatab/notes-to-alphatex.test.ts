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
});
