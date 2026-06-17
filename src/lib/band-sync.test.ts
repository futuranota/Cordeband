import { describe, expect, it } from 'vitest';
import {
  beatFromPlayStart,
  BAND_PRE_ROLL_SECS,
  isInPreRoll,
  isRoomPlaying,
  preRollRemainingSecs,
} from './band-sync';

describe('beatFromPlayStart', () => {
  it('returns 0 at start time', () => {
    const start = '2030-06-01T12:00:00.000Z';
    expect(beatFromPlayStart(start, 120, 1, Date.parse(start), 0)).toBe(0);
  });

  it('stays at 0 during pre-roll', () => {
    const start = '2030-06-01T12:00:00.000Z';
    const midPreRoll = Date.parse(start) + 1500;
    expect(beatFromPlayStart(start, 60, 1, midPreRoll, BAND_PRE_ROLL_SECS)).toBe(0);
  });

  it('advances beats after pre-roll', () => {
    const start = '2030-06-01T12:00:00.000Z';
    const afterPreRoll = Date.parse(start) + BAND_PRE_ROLL_SECS * 1000 + 1000;
    expect(beatFromPlayStart(start, 60, 1, afterPreRoll, BAND_PRE_ROLL_SECS)).toBeCloseTo(1, 5);
  });

  it('advances beats with elapsed time', () => {
    const start = '2030-06-01T12:00:00.000Z';
    const oneSecLater = Date.parse(start) + 1000;
    expect(beatFromPlayStart(start, 60, 1, oneSecLater, 0)).toBeCloseTo(1, 5);
  });

  it('applies tempo multiplier', () => {
    const start = '2030-06-01T12:00:00.000Z';
    const oneSecLater = Date.parse(start) + 1000;
    expect(beatFromPlayStart(start, 60, 0.5, oneSecLater, 0)).toBeCloseTo(0.5, 5);
  });
});

describe('preRollRemainingSecs', () => {
  it('counts down during pre-roll window', () => {
    const start = '2030-06-01T12:00:00.000Z';
    expect(preRollRemainingSecs(start, Date.parse(start) + 500)).toBe(3);
    expect(preRollRemainingSecs(start, Date.parse(start) + 2500)).toBe(1);
    expect(preRollRemainingSecs(start, Date.parse(start) + 3000)).toBe(0);
  });
});

describe('isInPreRoll', () => {
  it('detects pre-roll phase', () => {
    const start = '2030-06-01T12:00:00.000Z';
    expect(isInPreRoll(start, Date.parse(start) + 1000)).toBe(true);
    expect(isInPreRoll(start, Date.parse(start) + 4000)).toBe(false);
    expect(isInPreRoll(null)).toBe(false);
  });
});

describe('isRoomPlaying', () => {
  it('requires playing status and timestamp', () => {
    expect(isRoomPlaying('playing', '2030-01-01T00:00:00Z')).toBe(true);
    expect(isRoomPlaying('waiting', '2030-01-01T00:00:00Z')).toBe(false);
    expect(isRoomPlaying('playing', null)).toBe(false);
  });
});
