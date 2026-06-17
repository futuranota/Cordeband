'use client';

import { useEffect, useState } from 'react';
import {
  beatFromPlayStart,
  BAND_PRE_ROLL_SECS,
  isRoomPlaying,
} from '@/lib/band-sync';
import type { BandRoomRecord } from '@/types/band';

export type UseBandSyncOptions = {
  enabled: boolean;
  room: BandRoomRecord | null;
  bpm: number;
  tempo: number;
  totalBeats: number;
};

export type UseBandSyncResult = {
  playing: boolean;
  curBeat: number;
  synced: boolean;
  inPreRoll: boolean;
};

export function useBandSync(opts: UseBandSyncOptions): UseBandSyncResult {
  const [playing, setPlaying] = useState(false);
  const [curBeat, setCurBeat] = useState(0);
  const [inPreRoll, setInPreRoll] = useState(false);

  const roomPlaying = opts.room != null && isRoomPlaying(opts.room.status, opts.room.play_started_at);

  useEffect(() => {
    if (!opts.enabled || !opts.room || !roomPlaying || !opts.room.play_started_at) {
      setPlaying(false);
      setInPreRoll(false);
      return;
    }

    setPlaying(true);
    let raf = 0;
    const playStartedAt = opts.room.play_started_at!;

    const tick = () => {
      const nowMs = Date.now();
      const preRollEnd = Date.parse(playStartedAt) + BAND_PRE_ROLL_SECS * 1000;
      const stillPreRoll = !Number.isNaN(preRollEnd) && nowMs < preRollEnd;

      setInPreRoll(stillPreRoll);

      const beat = beatFromPlayStart(
        playStartedAt,
        opts.bpm,
        opts.tempo,
        nowMs,
      );

      if (beat >= opts.totalBeats) {
        setCurBeat(opts.totalBeats);
        setPlaying(false);
        setInPreRoll(false);
        return;
      }

      setCurBeat(beat);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    opts.enabled,
    opts.room?.id,
    opts.room?.status,
    opts.room?.play_started_at,
    opts.bpm,
    opts.tempo,
    opts.totalBeats,
    roomPlaying,
  ]);

  useEffect(() => {
    if (!opts.enabled || !opts.room || opts.room.status === 'waiting') {
      setCurBeat(0);
      setInPreRoll(false);
      if (!roomPlaying) setPlaying(false);
    }
  }, [opts.enabled, opts.room?.status, roomPlaying]);

  return {
    playing: opts.enabled && roomPlaying ? playing : false,
    curBeat: opts.enabled && roomPlaying ? curBeat : 0,
    synced: opts.enabled && roomPlaying && !inPreRoll,
    inPreRoll: opts.enabled && roomPlaying && inPreRoll,
  };
}
