'use client';

import { useEffect, useRef } from 'react';

type BandAudioControls = {
  audioReady: boolean;
  playing: boolean;
  curBeat: number;
  play: () => Promise<void>;
  pause: () => void;
  seek: (beat: number) => void;
};

export type UseBandAudioFollowOptions = {
  enabled: boolean;
  roomStatus: 'waiting' | 'playing' | 'ended' | null | undefined;
  synced: boolean;
  syncBeat: number;
  bpm: number;
  audio: BandAudioControls;
};

const DRIFT_SECS = 0.15;

export function useBandAudioFollow(opts: UseBandAudioFollowOptions): void {
  const lastSeekRef = useRef(0);
  const audioRef = useRef(opts.audio);
  audioRef.current = opts.audio;

  useEffect(() => {
    if (!opts.enabled) return;

    const audio = audioRef.current;
    if (!audio.audioReady) return;

    const { roomStatus, synced, syncBeat, bpm } = opts;
    const driftThresholdBeats = (bpm / 60) * DRIFT_SECS;

    if (roomStatus !== 'playing') {
      if (audio.playing) audio.pause();
      if (audio.curBeat !== 0) audio.seek(0);
      lastSeekRef.current = 0;
      return;
    }

    if (!synced) {
      if (audio.playing) audio.pause();
      if (audio.curBeat !== 0) audio.seek(0);
      lastSeekRef.current = 0;
      return;
    }

    const drift = Math.abs(audio.curBeat - syncBeat);

    if (!audio.playing) {
      audio.seek(syncBeat);
      void audio.play();
      lastSeekRef.current = syncBeat;
      return;
    }

    if (drift > driftThresholdBeats && Math.abs(lastSeekRef.current - syncBeat) > driftThresholdBeats / 2) {
      audio.seek(syncBeat);
      lastSeekRef.current = syncBeat;
    }
  }, [
    opts.enabled,
    opts.roomStatus,
    opts.synced,
    opts.syncBeat,
    opts.bpm,
    opts.audio.audioReady,
    opts.audio.playing,
    opts.audio.curBeat,
  ]);
}
