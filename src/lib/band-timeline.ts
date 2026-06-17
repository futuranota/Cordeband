import {
  DEMO_ENTRY_SCHEDULE_FRACTIONS,
  fractionsToBeatWindows,
  type EntryScheduleFractions,
  type EntryWindow,
} from '@/lib/band-schedule';
import type { InstrumentKey } from '@/lib/data';

export type TimelineLane = {
  id: string;
  name: string;
  instrument: InstrumentKey;
  windows: EntryWindow[];
  laneIndex: number;
};

export function buildTimelineLanes(
  members: readonly { id: string; name: string; instrument: InstrumentKey; active?: boolean }[],
  totalBeats: number,
  schedule: EntryScheduleFractions = DEMO_ENTRY_SCHEDULE_FRACTIONS,
): TimelineLane[] {
  return members
    .filter((m) => m.active !== false)
    .map((m, laneIndex) => ({
      id: m.id,
      name: m.name,
      instrument: m.instrument,
      windows: fractionsToBeatWindows(schedule[m.instrument] ?? [], totalBeats),
      laneIndex,
    }));
}
