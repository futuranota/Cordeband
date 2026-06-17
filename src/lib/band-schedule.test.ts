import { describe, expect, it } from 'vitest';
import {
  activeInstrumentsAt,
  DEMO_ENTRY_SCHEDULE_FRACTIONS,
  DEMO_YOUR_PART_FRACTIONS,
  findCurrentWindow,
  findNextWindow,
  fractionsToBeatWindows,
  isBeatInWindows,
  isFractionInWindows,
  nextEntryFor,
  viewerPartStatus,
} from './band-schedule';

const TOTAL = 100;

describe('fractionsToBeatWindows', () => {
  it('maps 0–1 fractions to beat ranges', () => {
    expect(fractionsToBeatWindows([[0.1, 0.3]], 200)).toEqual([
      { startBeat: 20, endBeat: 60 },
    ]);
  });
});

describe('isFractionInWindows', () => {
  it('is true inside and false at end boundary', () => {
    const wins = [[0.2, 0.5]] as const;
    expect(isFractionInWindows(0.2, wins)).toBe(true);
    expect(isFractionInWindows(0.49, wins)).toBe(true);
    expect(isFractionInWindows(0.5, wins)).toBe(false);
    expect(isFractionInWindows(0.1, wins)).toBe(false);
  });
});

describe('findCurrentWindow / findNextWindow', () => {
  const windows = fractionsToBeatWindows(
    [
      [0.1, 0.3],
      [0.5, 0.7],
    ],
    TOTAL,
  );

  it('finds current window', () => {
    expect(findCurrentWindow(15, windows)?.startBeat).toBe(10);
    expect(findCurrentWindow(35, windows)).toBeNull();
    expect(findCurrentWindow(55, windows)?.startBeat).toBe(50);
  });

  it('finds next window after curBeat', () => {
    expect(findNextWindow(5, windows)?.startBeat).toBe(10);
    expect(findNextWindow(25, windows)?.startBeat).toBe(50);
    expect(findNextWindow(80, windows)).toBeNull();
  });
});

describe('viewerPartStatus', () => {
  const yourWindows = fractionsToBeatWindows(DEMO_YOUR_PART_FRACTIONS, TOTAL);

  it('returns live inside a part', () => {
    const s = viewerPartStatus(10, yourWindows);
    expect(s.status).toBe('live');
    expect(s.curPart).not.toBeNull();
  });

  it('returns ready within lead beats of next entry', () => {
    // Next guitar part starts at beat 34; lead = 8 → ready from beat 26
    const s = viewerPartStatus(30, yourWindows, 8);
    expect(s.status).toBe('ready');
    expect(s.nextPart?.startBeat).toBe(34);
  });

  it('returns waiting when far from next entry', () => {
    // After 2nd part (ends 58); next at 68 → 10 beats away (> lead 8)
    const s = viewerPartStatus(58, yourWindows, 8);
    expect(s.status).toBe('waiting');
  });
});

describe('activeInstrumentsAt', () => {
  const present = ['guitar', 'drums', 'bass', 'vocals', 'piano'] as const;

  it('activates drums early in the song (fraction schedule)', () => {
    const at5 = activeInstrumentsAt(5, TOTAL, DEMO_ENTRY_SCHEDULE_FRACTIONS, present);
    expect(at5).toContain('drums');
  });

  it('solo mode: guitar uses your-part windows, not full SCHED guitar', () => {
    // Beat 30: guitar SCHED fraction window includes 0.34–0.58 but YOUR part starts at 34
    const at30 = activeInstrumentsAt(30, TOTAL, DEMO_ENTRY_SCHEDULE_FRACTIONS, present, {
      yourInstrument: 'guitar',
      yourPartFractions: DEMO_YOUR_PART_FRACTIONS,
    });
    expect(at30).not.toContain('guitar');
    expect(at30).toContain('drums');
  });

  it('solo mode: guitar active inside your-part window', () => {
    const at40 = activeInstrumentsAt(40, TOTAL, DEMO_ENTRY_SCHEDULE_FRACTIONS, present, {
      yourInstrument: 'guitar',
      yourPartFractions: DEMO_YOUR_PART_FRACTIONS,
    });
    expect(at40).toContain('guitar');
  });

  it('band mode (no yourInstrument): all instruments follow schedule only', () => {
    const at40 = activeInstrumentsAt(40, TOTAL, DEMO_ENTRY_SCHEDULE_FRACTIONS, present);
    expect(at40).toContain('guitar');
    expect(at40).toContain('drums');
  });
});

describe('nextEntryFor', () => {
  it('returns next your-part window for guitar', () => {
    const next = nextEntryFor(
      'guitar',
      10,
      TOTAL,
      DEMO_ENTRY_SCHEDULE_FRACTIONS,
      DEMO_YOUR_PART_FRACTIONS,
    );
    expect(next?.startBeat).toBe(34);
  });

  it('returns next schedule window without yourPartFractions', () => {
    const next = nextEntryFor('vocals', 10, TOTAL, DEMO_ENTRY_SCHEDULE_FRACTIONS);
    expect(next?.startBeat).toBe(20);
  });
});

describe('isBeatInWindows', () => {
  it('matches beat ranges', () => {
    const w = [{ startBeat: 10, endBeat: 26 }];
    expect(isBeatInWindows(10, w)).toBe(true);
    expect(isBeatInWindows(25.9, w)).toBe(true);
    expect(isBeatInWindows(26, w)).toBe(false);
  });
});
