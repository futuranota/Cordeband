import type { ScoreNote } from '@/lib/data';

/** Duration of the MIDI score in seconds (last note end). */
export function midiDurationFromNotes(notes: readonly Pick<ScoreNote, 'startTime' | 'endTime' | 'beat' | 'dur'>[], bpm = 120): number {
  if (!notes.length) return 0;

  let maxSec = 0;
  for (const n of notes) {
    const endSec = n.endTime != null
      ? n.endTime
      : ((n.beat + n.dur) * 60) / bpm;
    if (endSec > maxSec) maxSec = endSec;
  }
  return maxSec;
}

export function isUserUploadedScore(notes: readonly Pick<ScoreNote, 'source'>[]): boolean {
  return notes.some((n) => n.source === 'user_upload');
}

/**
 * Maps audio playback time → score timeline.
 * Proportional: 50% through audio = 50% through MIDI scroll,
 * even when audio and MIDI are different recordings/lengths.
 */
export function mapAudioTimeToScoreTime(
  audioSec: number,
  audioDurationSec: number,
  midiDurationSec: number,
): number {
  if (!Number.isFinite(audioSec) || audioSec <= 0) return 0;
  if (midiDurationSec <= 0) return Math.max(0, audioSec);
  if (audioDurationSec <= 0) return Math.min(midiDurationSec, audioSec);

  const progress = Math.min(1, Math.max(0, audioSec / audioDurationSec));
  return progress * midiDurationSec;
}

export function scoreBeatAtAudioTime(
  audioSec: number,
  audioDurationSec: number,
  midiDurationSec: number,
  bpm: number,
): number {
  const scoreSec = mapAudioTimeToScoreTime(audioSec, audioDurationSec, midiDurationSec);
  return (scoreSec * bpm) / 60;
}

export type ScorePlaybackClock = {
  curTimeSec: number;
  curBeat: number;
  proportional: boolean;
};

export function resolveScorePlaybackClock(
  audioSec: number,
  audioBeat: number,
  audioDurationSec: number,
  bpm: number,
  notes: readonly ScoreNote[],
  scoreSource?: string | null,
): ScorePlaybackClock {
  const userMidi = scoreSource === 'user_upload' || isUserUploadedScore(notes);
  if (!userMidi || !notes.length) {
    return { curTimeSec: audioSec, curBeat: audioBeat, proportional: false };
  }

  const midiDurationSec = midiDurationFromNotes(notes, bpm);
  const scoreSec = mapAudioTimeToScoreTime(audioSec, audioDurationSec, midiDurationSec);
  const scoreBeat = (scoreSec * bpm) / 60;

  return { curTimeSec: scoreSec, curBeat: scoreBeat, proportional: true };
}
