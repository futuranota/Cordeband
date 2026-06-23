'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InstrumentKey } from '@/lib/data';
import { fetchSongStems } from '@/lib/supabase/fetch-song-stems';
import { fetchSongOriginal } from '@/lib/supabase/fetch-song-original';
import { usePlayerStore } from '@/stores/playerStore';

export const ORIGINAL_TRACK_KEY = 'original';

export const STEM_DEF_VOL: Record<string, number> = {
  vocals: 78, drums: 82, bass: 80, piano: 70, guitar: 76, other: 64,
  [ORIGINAL_TRACK_KEY]: 100,
};

export type UsePlayerAudioOptions = {
  enabled: boolean;
  songId: string | null;
  bpm: number;
  totalBeats: number;
  durationSeconds?: number;
  instrument: InstrumentKey;
  vols: Record<string, number>;
  tempo: number;
  loop: { a: number; b: number } | null;
};

function beatToSeconds(beat: number, bpm: number): number {
  return beat * 60 / bpm;
}

function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

function safeCloseAudioContext(ctx: AudioContext | null | undefined) {
  if (!ctx || ctx.state === 'closed') return;
  void ctx.close().catch(() => {});
}

function playbackLimitBeats(
  scoreBeats: number,
  durationSeconds: number | undefined,
  bpm: number,
  maxBufferSeconds: number,
): number {
  const fromSong = durationSeconds && durationSeconds > 0
    ? secondsToBeats(durationSeconds, bpm)
    : 0;
  const fromBuffers = maxBufferSeconds > 0 ? secondsToBeats(maxBufferSeconds, bpm) : 0;

  if (fromBuffers > 0) {
    return Math.max(fromBuffers, fromSong > 0 ? Math.min(fromSong, fromBuffers * 1.02) : 0, 1);
  }

  return Math.max(scoreBeats, fromSong, 1);
}

export function usePlayerAudio(opts: UsePlayerAudioOptions) {
  const {
    setAudioReady,
    setAudioLoading,
    setAudioError,
    setPlaying,
    setCurBeat,
    setCurTimeSec, // NUEVO
    playing,
    curBeat,
    curTimeSec,
    audioReady,
    audioLoading,
    audioError,
    reset,
  } = usePlayerStore();

  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const gainsRef = useRef<Map<string, GainNode>>(new Map());
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playStartCtxRef = useRef(0);
  const startBeatRef = useRef(0);
  const rafRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const playbackLimitRef = useRef(1);
  const [playbackLimit, setPlaybackLimit] = useState(1);
  const [loadedStems, setLoadedStems] = useState<string[]>([]);

  // NUEVO: ref para curTimeSec — evita re-render extra, lo leemos en el tick
  const curTimeSecRef = useRef(0);

  const refreshPlaybackLimit = useCallback((maxBufferSeconds = 0) => {
    const { totalBeats, durationSeconds, bpm } = optsRef.current;
    playbackLimitRef.current = playbackLimitBeats(
      totalBeats,
      durationSeconds,
      bpm,
      maxBufferSeconds,
    );
    setPlaybackLimit(playbackLimitRef.current);
  }, []);

  const stopSources = useCallback(() => {
    for (const src of sourcesRef.current) {
      try { src.stop(); } catch { /* already stopped */ }
      src.disconnect();
    }
    sourcesRef.current = [];
  }, []);

  const applyVols = useCallback(() => {
    const { vols } = optsRef.current;
    let audible = 0;
    for (const [inst, gain] of gainsRef.current) {
      const pct = vols[inst] ?? STEM_DEF_VOL[inst] ?? 70;
      const value = Math.max(0, Math.min(1, pct / 100));
      gain.gain.value = value;
      if (value > 0) audible += 1;
    }
    if (audible === 0 && gainsRef.current.size > 0) {
      for (const [inst, gain] of gainsRef.current) {
        gain.gain.value = Math.max(0, Math.min(1, (STEM_DEF_VOL[inst] ?? 70) / 100));
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

    // NUEVO: sincronizar curTimeSec al hacer seek/play
    const startTimeSec = beatToSeconds(fromBeat, optsRef.current.bpm);
    curTimeSecRef.current = startTimeSec;
    setCurTimeSec(startTimeSec);
  }, [stopSources, setCurTimeSec]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && playing) {
      const elapsed = (ctx.currentTime - playStartCtxRef.current) * optsRef.current.tempo;
      const beat = startBeatRef.current + elapsed * (optsRef.current.bpm / 60);
      setCurBeat(Math.min(beat, playbackLimitRef.current));

      // NUEVO: guardar curTimeSec al pausar
      const tSec = beatToSeconds(startBeatRef.current, optsRef.current.bpm) + elapsed;
      curTimeSecRef.current = tSec;
      setCurTimeSec(tSec);
    }
    stopSources();
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, [playing, setCurBeat, setCurTimeSec, setPlaying, stopSources]);

  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx || !audioReady) return;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      await ctx.resume();
    }
    startSources(usePlayerStore.getState().curBeat);
    setPlaying(true);
  }, [audioReady, setPlaying, startSources]);

  const toggle = useCallback(async () => {
    if (playing) {
      pause();
    } else {
      const ctx = ctxRef.current;
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
        await ctx.resume();
      }
      await play();
    }
  }, [pause, play, playing]);

  const seek = useCallback((beat: number) => {
    const clamped = Math.max(0, Math.min(beat, playbackLimitRef.current));
    setCurBeat(clamped);
    if (playing) {
      startSources(clamped);
    } else {
      // NUEVO: actualizar curTimeSec también al hacer seek en pausa
      const tSec = beatToSeconds(clamped, optsRef.current.bpm);
      curTimeSecRef.current = tSec;
      setCurTimeSec(tSec);
    }
  }, [playing, setCurBeat, setCurTimeSec, startSources]);

  useEffect(() => {
    applyVols();
  }, [applyVols, opts.instrument, opts.vols]);

  useEffect(() => {
    const maxSec = Math.max(
      ...Array.from(buffersRef.current.values()).map((b) => b.duration),
      0,
    );
    refreshPlaybackLimit(maxSec);
  }, [opts.totalBeats, opts.durationSeconds, opts.bpm, refreshPlaybackLimit]);

  useEffect(() => {
    if (!opts.enabled || !opts.songId) {
      reset();
      stopSources();
      buffersRef.current.clear();
      gainsRef.current.clear();
      setLoadedStems([]);
      if (ctxRef.current) {
        safeCloseAudioContext(ctxRef.current);
        ctxRef.current = null;
      }
      return;
    }

    let cancelled = false;
    reset();
    setAudioLoading(true);
    setAudioError(null);
    setLoadedStems([]);

    void (async () => {
      try {
        const [stems, original] = await Promise.all([
          fetchSongStems(opts.songId!).catch(() => []),
          fetchSongOriginal(opts.songId!),
        ]);
        if (cancelled) return;

        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const decoded = await Promise.all(
          stems.map(async (s) => {
            const res = await fetch(s.signedUrl);
            if (!res.ok) throw new Error(`Failed to fetch stem ${s.instrument}`);
            const ab = await res.arrayBuffer();
            const buffer = await ctx.decodeAudioData(ab);
            return { instrument: s.instrument as string, buffer };
          }),
        );

        if (original) {
          try {
            const res = await fetch(original.signedUrl);
            if (res.ok) {
              const ab = await res.arrayBuffer();
              const buffer = await ctx.decodeAudioData(ab);
              decoded.push({ instrument: ORIGINAL_TRACK_KEY, buffer });
            }
          } catch {
            /* original mix is optional — playback continues with separated stems */
          }
        }

        if (decoded.length === 0) {
          throw new Error('No audio available for this song');
        }

        if (cancelled) {
          safeCloseAudioContext(ctx);
          return;
        }

        buffersRef.current.clear();
        gainsRef.current.clear();
        const master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);

        for (const { instrument, buffer } of decoded) {
          buffersRef.current.set(instrument, buffer);
          const gain = ctx.createGain();
          gain.connect(master);
          gainsRef.current.set(instrument, gain);
        }

        const stemKeys = decoded.map((d) => d.instrument);
        setLoadedStems(stemKeys);

        const maxBufferSeconds = decoded.reduce(
          (max, item) => Math.max(max, item.buffer.duration),
          0,
        );
        refreshPlaybackLimit(maxBufferSeconds);
        applyVols();
        setAudioReady(true);
        setAudioLoading(false);
      } catch (err) {
        if (cancelled) return;
        setAudioError(err instanceof Error ? err.message : 'Audio load failed');
        setAudioLoading(false);
        setAudioReady(false);
        setLoadedStems([]);
      }
    })();

    return () => {
      cancelled = true;
      stopSources();
      if (ctxRef.current) {
        safeCloseAudioContext(ctxRef.current);
        ctxRef.current = null;
      }
    };
  }, [opts.enabled, opts.songId, applyVols, refreshPlaybackLimit, reset, setAudioError, setAudioLoading, setAudioReady, stopSources]);

  // ── RAF tick — actualiza curBeat Y curTimeSec cada frame ──────────────────
  useEffect(() => {
    if (!playing || !audioReady) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const { bpm, tempo, loop } = optsRef.current;
      const limit = playbackLimitRef.current;
      const elapsed = Math.max(0, (ctx.currentTime - playStartCtxRef.current) * tempo);
      let beat = startBeatRef.current + elapsed * (bpm / 60);

      // NUEVO: tiempo real en segundos (independiente del BPM estimado)
      const startTimeSec = beatToSeconds(startBeatRef.current, bpm);
      const tSec = startTimeSec + elapsed;

      if (loop && beat >= loop.b) {
        beat = loop.a;
        startSources(loop.a);
        setCurBeat(loop.a);
        // NUEVO: reset curTimeSec al inicio del loop
        const loopStartSec = beatToSeconds(loop.a, bpm);
        curTimeSecRef.current = loopStartSec;
        setCurTimeSec(loopStartSec);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (beat >= limit) {
        setCurBeat(limit);
        setCurTimeSec(beatToSeconds(limit, bpm)); // NUEVO
        pause();
        return;
      }

      setCurBeat(beat);
      curTimeSecRef.current = tSec;
      setCurTimeSec(tSec); // NUEVO
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, audioReady, pause, setCurBeat, setCurTimeSec, startSources]);

  useEffect(() => {
    if (!playing) return;
    stopSources();
    startSources(usePlayerStore.getState().curBeat);
  }, [opts.tempo]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    audioReady,
    audioLoading,
    audioError,
    playing,
    curBeat,
    curTimeSec,
    playbackLimitBeats: playbackLimit,
    loadedStems,
    play,
    pause,
    toggle,
    seek,
  };
}
