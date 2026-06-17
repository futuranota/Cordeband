/**
 * Beat position from server play_started_at (shared across all clients).
 * During pre_roll_secs after play_started_at, beat stays at 0.
 */
export const BAND_PRE_ROLL_SECS = 3;

export function beatFromPlayStart(
  playStartedAt: string,
  bpm: number,
  tempo: number,
  nowMs: number = Date.now(),
  preRollSecs: number = BAND_PRE_ROLL_SECS,
): number {
  const startMs = Date.parse(playStartedAt);
  if (Number.isNaN(startMs)) return 0;
  const musicStartMs = startMs + preRollSecs * 1000;
  const elapsedSec = Math.max(0, (nowMs - musicStartMs) / 1000);
  return elapsedSec * (bpm / 60) * tempo;
}

export function preRollRemainingSecs(
  playStartedAt: string,
  nowMs: number = Date.now(),
  preRollSecs: number = BAND_PRE_ROLL_SECS,
): number {
  const startMs = Date.parse(playStartedAt);
  if (Number.isNaN(startMs)) return 0;
  const preRollEnd = startMs + preRollSecs * 1000;
  if (nowMs >= preRollEnd) return 0;
  return Math.max(1, Math.ceil((preRollEnd - nowMs) / 1000));
}

export function isInPreRoll(
  playStartedAt: string | null,
  nowMs: number = Date.now(),
  preRollSecs: number = BAND_PRE_ROLL_SECS,
): boolean {
  if (!playStartedAt) return false;
  return preRollRemainingSecs(playStartedAt, nowMs, preRollSecs) > 0;
}

export function isRoomPlaying(
  status: string,
  playStartedAt: string | null,
): boolean {
  return status === 'playing' && playStartedAt != null;
}
