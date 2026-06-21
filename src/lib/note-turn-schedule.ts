import type { ScoreNote } from '@/lib/data';
import type { EntryWindow } from '@/lib/band-schedule';
import { isBeatInWindow } from '@/lib/band-schedule';

export type WindowsFromNotesOptions = {
  /** Beats of silence between note clusters to start a new segment. */
  gapBeats?: number;
  /** Drop segments shorter than this (beats). */
  minSegmentBeats?: number;
  /** Pad before/after each segment (beats). */
  padBeats?: number;
};

/**
 * Derive "your turn" windows from transcribed notes.
 * Clusters of notes separated by gaps become playable segments.
 */
export function windowsFromNotes(
  notes: readonly ScoreNote[],
  options: WindowsFromNotesOptions = {},
): EntryWindow[] {
  if (!notes.length) return [];

  const gapBeats = options.gapBeats ?? 2;
  const minSegmentBeats = options.minSegmentBeats ?? 0.5;
  const padBeats = options.padBeats ?? 0.25;

  const sorted = [...notes].sort((a, b) => a.beat - b.beat);
  const windows: EntryWindow[] = [];

  let segStart = sorted[0].beat;
  let segEnd = sorted[0].beat + sorted[0].dur;

  const flush = () => {
    if (segEnd - segStart < minSegmentBeats) return;
    windows.push({
      startBeat: Math.max(0, segStart - padBeats),
      endBeat: segEnd + padBeats,
    });
  };

  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    const gap = n.beat - segEnd;
    if (gap > gapBeats) {
      flush();
      segStart = n.beat;
      segEnd = n.beat + n.dur;
    } else {
      segEnd = Math.max(segEnd, n.beat + n.dur);
    }
  }
  flush();

  return windows;
}

/** True when `beat` falls inside any of the player's note-derived windows. */
export function isYourTurnAt(
  beat: number,
  yourWindows: readonly EntryWindow[],
): boolean {
  return yourWindows.some((w) => isBeatInWindow(beat, w));
}
