'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { InstrumentKey } from '@/lib/data';
import { fetchSongStems } from '@/lib/supabase/fetch-song-stems';
import { usePlayerStore } from '@/stores/playerStore';

const DEF_VOL: Record<string, number> = {
  vocals: 78, drums: 82, bass: 80, piano: 70, guitar: 76, other: 64,
};

export type UsePlayerAudioOptions = {
  enabled: boolean;
  songId: string | null;
  bpm: number;
  totalBeats: number;
  instrument: InstrumentKey;
  vols: Record<string, number>;
  tempo: number;
  loop: { a: number; b: number } | null;
};

function beatToSeconds(beat: number, bpm: number): number {
  return beat * 60 / bpm;
}

export function usePlayerAudio(opts: UsePlayerAudioOptions) {
  const {
    setAudioReady,
    setAudioLoading,
    setAudioError,
    setPlaying,
    setCurBeat,
    playing,
    curBeat,
    audioReady,
    audioLoading,
    audioError,
    reset,
  } = usePlayerStore();

  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<InstrumentKey, AudioBuffer>>(new Map());
  const gainsRef = useRef<Map<InstrumentKey, GainNode>>(new Map());
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playStartCtxRef = useRef(0);
  const startBeatRef = useRef(0);
  const rafRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const stopSources = useCallback(() => {
    for (const src of sourcesRef.current) {
      try { src.stop(); } catch { /* already stopped */ }
      src.disconnect();
    }
    sourcesRef.current = [];
  }, []);

  const applyVols = useCallback(() => {
    const { instrument, vols } = optsRef.current;
    for (const [inst, gain] of gainsRef.current) {
      if (inst === instrument) {
        gain.gain.value = 0;
      } else {
        const pct = vols[inst] ?? DEF_VOL[inst] ?? 70;
        gain.gain.value = Math.max(0, Math.min(1, pct / 100));
      }
    }
  }, []);

  const startSources = useCallback((fromBeat: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    stopSources();

    const { bpm, tempo } = optsRef.current;
    const offsetSec = beatToSeconds(fromBeat, bpm);
    const when = ctx.currentTime + 0.05;

    for (const [inst, buffer] of buffersRef.current) {
      const gain = gainsRef.current.get(inst);
      if (!gain) continue;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = tempo;
      src.connect(gain);
      src.start(when, offsetSec);
      sourcesRef.current.push(src);
    }

    playStartCtxRef.current = when;
    startBeatRef.current = fromBeat;
  }, [stopSources]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && playing) {
      const elapsed = (ctx.currentTime - playStartCtxRef.current) * optsRef.current.tempo;
      const beat = startBeatRef.current + elapsed * (optsRef.current.bpm / 60);
      setCurBeat(Math.min(beat, optsRef.current.totalBeats));
    }
    stopSources();
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, [playing, setCurBeat, setPlaying, stopSources]);

  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx || !audioReady) return;
    await ctx.resume();
    startSources(usePlayerStore.getState().curBeat);
    setPlaying(true);
  }, [audioReady, setPlaying, startSources]);

  const toggle = useCallback(async () => {
    if (playing) {
      pause();
    } else {
      await play();
    }
  }, [pause, play, playing]);

  const seek = useCallback((beat: number) => {
    const clamped = Math.max(0, Math.min(beat, optsRef.current.totalBeats));
    setCurBeat(clamped);
    if (playing) {
      startSources(clamped);
    }
  }, [playing, setCurBeat, startSources]);

  useEffect(() => {
    applyVols();
  }, [applyVols, opts.instrument, opts.vols]);

  useEffect(() => {
    if (!opts.enabled || !opts.songId) {
      reset();
      stopSources();
      buffersRef.current.clear();
      gainsRef.current.clear();
      if (ctxRef.current) {
        void ctxRef.current.close();
        ctxRef.current = null;
      }
      return;
    }

    let cancelled = false;
    reset();
    setAudioLoading(true);
    setAudioError(null);

    void (async () => {
      try {
        const stems = await fetchSongStems(opts.songId!);
        if (cancelled) return;

        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const decoded = await Promise.all(
          stems.map(async (s) => {
            const res = await fetch(s.signedUrl);
            if (!res.ok) throw new Error(`Failed to fetch stem ${s.instrument}`);
            const ab = await res.arrayBuffer();
            const buffer = await ctx.decodeAudioData(ab);
            return { instrument: s.instrument, buffer };
          }),
        );

        if (cancelled) {
          void ctx.close();
          return;
        }

        buffersRef.current.clear();
        gainsRef.current.clear();
        const master = ctx.createGain();
        master.connect(ctx.destination);

        for (const { instrument, buffer } of decoded) {
          buffersRef.current.set(instrument, buffer);
          const gain = ctx.createGain();
          gain.connect(master);
          gainsRef.current.set(instrument, gain);
        }

        applyVols();
        setAudioReady(true);
        setAudioLoading(false);
      } catch (err) {
        if (cancelled) return;
        setAudioError(err instanceof Error ? err.message : 'Audio load failed');
        setAudioLoading(false);
        setAudioReady(false);
      }
    })();

    return () => {
      cancelled = true;
      stopSources();
      if (ctxRef.current) {
        void ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [opts.enabled, opts.songId, applyVols, reset, setAudioError, setAudioLoading, setAudioReady, stopSources]);

  useEffect(() => {
    if (!playing || !audioReady) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const { bpm, tempo, totalBeats, loop } = optsRef.current;
      const elapsed = Math.max(0, (ctx.currentTime - playStartCtxRef.current) * tempo);
      let beat = startBeatRef.current + elapsed * (bpm / 60);

      if (loop && beat >= loop.b) {
        beat = loop.a;
        startSources(loop.a);
        setCurBeat(loop.a);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (beat >= totalBeats) {
        setCurBeat(totalBeats);
        pause();
        return;
      }

      setCurBeat(beat);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, audioReady, pause, setCurBeat, startSources]);

  useEffect(() => {
    if (!playing) return;
    stopSources();
    startSources(usePlayerStore.getState().curBeat);
  }, [opts.tempo]); // eslint-disable-line react-hooks/exhaustive-deps -- restart on tempo change while playing

  return {
    audioReady,
    audioLoading,
    audioError,
    playing,
    curBeat,
    play,
    pause,
    toggle,
    seek,
  };
}
