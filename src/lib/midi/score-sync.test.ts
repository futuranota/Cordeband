import { describe, expect, it } from 'vitest';
import {
  mapAudioTimeToScoreTime,
  resolveScorePlaybackClock,
  scoreBeatAtAudioTime,
} from '@/lib/midi/score-sync';
import type { ScoreNote } from '@/lib/data';

const userNote: ScoreNote = {
  beat: 0,
  dur: 4,
  midi: 60,
  s: 0,
  tab: { string: 0, fret: 0 },
  startTime: 0,
  endTime: 120,
  source: 'user_upload',
};

describe('mapAudioTimeToScoreTime', () => {
  it('maps halfway through audio to halfway through midi', () => {
    expect(mapAudioTimeToScoreTime(60, 120, 240)).toBe(120);
  });

  it('clamps at end of midi duration', () => {
    expect(mapAudioTimeToScoreTime(150, 120, 240)).toBe(240);
  });
});

describe('resolveScorePlaybackClock', () => {
  it('uses proportional clock for user MIDI', () => {
    const clock = resolveScorePlaybackClock(30, 60, 120, 120, [userNote], 'user_upload');
    expect(clock.proportional).toBe(true);
    expect(clock.curTimeSec).toBe(30);
  });

  it('uses audio clock for AI scores', () => {
    const clock = resolveScorePlaybackClock(30, 60, 120, 120, [{ ...userNote, source: 'ai_basic_pitch' }], 'ai_basic_pitch');
    expect(clock.proportional).toBe(false);
    expect(clock.curBeat).toBe(60);
  });
});

describe('scoreBeatAtAudioTime', () => {
  it('converts mapped seconds to beats', () => {
    expect(scoreBeatAtAudioTime(60, 120, 120, 120)).toBe(120);
  });
});
