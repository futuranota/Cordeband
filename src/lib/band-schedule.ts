import type { InstrumentKey } from '@/lib/data';

/** Window as fraction of song length (0–1). Legacy demo format from PlayerScreen. */
export type FractionWindow = readonly [start: number, end: number];

export type EntryWindow = { startBeat: number; endBeat: number };

export type EntryScheduleFractions = Partial<Record<InstrumentKey, FractionWindow[]>>;

export const LEAD_BEATS_DEFAULT = 8;

/** Per-instrument stage windows (demo song). */
export const DEMO_ENTRY_SCHEDULE_FRACTIONS: EntryScheduleFractions = {
  drums: [[0.05, 1.0]],
  bass: [[0.11, 1.0]],
  guitar: [[0.06, 0.26], [0.34, 0.58], [0.68, 0.92]],
  piano: [[0.0, 0.30], [0.40, 0.66], [0.80, 1.0]],
  vocals: [[0.20, 0.42], [0.52, 0.72], [0.86, 1.0]],
  other: [[0.30, 0.70]],
};

/** “Your part” windows for the lead instrument in solo demo (guitar). */
export const DEMO_YOUR_PART_FRACTIONS: FractionWindow[] = [
  [0.06, 0.26],
  [0.34, 0.58],
  [0.68, 0.92],
];

export function fractionsToBeatWindows(
  fractions: readonly FractionWindow[],
  totalBeats: number,
): EntryWindow[] {
  return fractions.map(([start, end]) => ({
    startBeat: start * totalBeats,
    endBeat: end * totalBeats,
  }));
}

export function beatScheduleFromFractions(
  fractions: EntryScheduleFractions,
  totalBeats: number,
): Partial<Record<InstrumentKey, EntryWindow[]>> {
  const out: Partial<Record<InstrumentKey, EntryWindow[]>> = {};
  for (const key of Object.keys(fractions) as InstrumentKey[]) {
    const wins = fractions[key];
    if (wins?.length) out[key] = fractionsToBeatWindows(wins, totalBeats);
  }
  return out;
}

export function isBeatInWindow(beat: number, window: EntryWindow): boolean {
  return beat >= window.startBeat && beat < window.endBeat;
}

export function isBeatInWindows(beat: number, windows: readonly EntryWindow[]): boolean {
  return windows.some((w) => isBeatInWindow(beat, w));
}

export function isFractionInWindows(
  fraction: number,
  windows: readonly FractionWindow[],
): boolean {
  return windows.some(([start, end]) => fraction >= start && fraction < end);
}

export function findCurrentWindow(
  curBeat: number,
  windows: readonly EntryWindow[],
): EntryWindow | null {
  return windows.find((w) => isBeatInWindow(curBeat, w)) ?? null;
}

export function findNextWindow(
  curBeat: number,
  windows: readonly EntryWindow[],
): EntryWindow | null {
  return windows.find((w) => w.startBeat > curBeat) ?? null;
}

export type ViewerPartStatus = {
  status: 'waiting' | 'ready' | 'live';
  curPart: EntryWindow | null;
  nextPart: EntryWindow | null;
};

export function viewerPartStatus(
  curBeat: number,
  yourWindows: readonly EntryWindow[],
  leadBeats: number = LEAD_BEATS_DEFAULT,
): ViewerPartStatus {
  const curPart = findCurrentWindow(curBeat, yourWindows);
  if (curPart) {
    return { status: 'live', curPart, nextPart: null };
  }

  const nextPart = findNextWindow(curBeat, yourWindows);
  if (!nextPart) {
    return { status: 'waiting', curPart: null, nextPart: null };
  }

  const beatsUntil = nextPart.startBeat - curBeat;
  const status = beatsUntil <= leadBeats ? 'ready' : 'waiting';
  return { status, curPart: null, nextPart };
}

export type ActiveInstrumentsOpts = {
  /** Solo mode: instrument the viewer plays — uses `yourPartFractions` instead of schedule. */
  yourInstrument?: InstrumentKey;
  yourPartFractions?: readonly FractionWindow[];
};

/**
 * Which instruments are “on stage” at `curBeat`.
 * Matches PlayerScreen solo logic when `yourInstrument` + `yourPartFractions` are set.
 */
export function activeInstrumentsAt(
  curBeat: number,
  totalBeats: number,
  scheduleFractions: EntryScheduleFractions,
  presentInstruments: readonly InstrumentKey[],
  opts?: ActiveInstrumentsOpts,
): InstrumentKey[] {
  if (totalBeats <= 0) return [];

  const fraction = curBeat / totalBeats;
  const yourWindows =
    opts?.yourPartFractions != null
      ? fractionsToBeatWindows(opts.yourPartFractions, totalBeats)
      : null;

  return presentInstruments.filter((key) => {
    if (
      opts?.yourInstrument != null &&
      key === opts.yourInstrument &&
      yourWindows != null
    ) {
      return isBeatInWindows(curBeat, yourWindows);
    }
    const fracs = scheduleFractions[key];
    if (!fracs?.length) return false;
    return isFractionInWindows(fraction, fracs);
  });
}

export function nextEntryFor(
  instrument: InstrumentKey,
  curBeat: number,
  totalBeats: number,
  scheduleFractions: EntryScheduleFractions,
  yourPartFractions?: readonly FractionWindow[],
): EntryWindow | null {
  if (yourPartFractions?.length) {
    return findNextWindow(curBeat, fractionsToBeatWindows(yourPartFractions, totalBeats));
  }
  const fracs = scheduleFractions[instrument];
  if (!fracs?.length) return null;
  return findNextWindow(curBeat, fractionsToBeatWindows(fracs, totalBeats));
}
