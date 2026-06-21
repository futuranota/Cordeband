'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InstrumentKey } from '@/lib/data';
import { STEM_DEF_VOL } from '@/hooks/usePlayerAudio';
import type { LandingDemoResponse } from '@/types/landing-demo';

function safeCloseAudioContext(ctx: AudioContext | null | undefined) {
  if (!ctx || ctx.state === 'closed') return;
  void ctx.close().catch(() => {});
}

function buildDefaultVols(): Record<string, number> {
  const vols: Record<string, number> = {};
  for (const [key, val] of Object.entries(STEM_DEF_VOL)) {
    vols[key] = val;
  }
  return vols;
}

export function useLandingStemDemo(sectionRef: React.RefObject<HTMLElement | null>) {
  const [demo, setDemo] = useState<LandingDemoResponse | null>(null);
  const [vols, setVols] = useState<Record<string, number>>(buildDefaultVols);
  const [playing, setPlaying] = useState(false);
  const [curTimeSec, setCurTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(18);
  const [audioReady, setAudioReady] = useState(false);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [loadedStems, setLoadedStems] = useState<InstrumentKey[]>([]);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<InstrumentKey, AudioBuffer>>(new Map());
  const gainsRef = useRef<Map<InstrumentKey, GainNode>>(new Map());
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playStartCtxRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const volsRef = useRef(vols);
  const curTimeSecRef = useRef(0);
  const playingRef = useRef(false);
  const hasPlayedOnceRef = useRef(false);
  volsRef.current = vols;
  playingRef.current = playing;
  hasPlayedOnceRef.current = hasPlayedOnce;
  curTimeSecRef.current = curTimeSec;

  const stopSources = useCallback(() => {
    for (const src of sourcesRef.current) {
      try { src.stop(); } catch { /* already stopped */ }
      src.disconnect();
    }
    sourcesRef.current = [];
  }, []);

  const applyVols = useCallback(() => {
    for (const [inst, gain] of gainsRef.current) {
      const pct = volsRef.current[inst] ?? STEM_DEF_VOL[inst] ?? 70;
      gain.gain.value = Math.max(0, Math.min(1, pct / 100));
    }
  }, []);

  const startSources = useCallback((fromSec: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    stopSources();

    const when = ctx.currentTime + 0.05;
    for (const [inst, buffer] of buffersRef.current) {
      const gain = gainsRef.current.get(inst);
      if (!gain) continue;
      const offset = Math.min(fromSec, Math.max(0, buffer.duration - 0.01));
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(when, offset);
      sourcesRef.current.push(src);
    }

    playStartCtxRef.current = when;
    startTimeRef.current = fromSec;
  }, [stopSources]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx && playingRef.current) {
      const elapsed = Math.max(0, ctx.currentTime - playStartCtxRef.current);
      const t = startTimeRef.current + elapsed;
      setCurTimeSec(Math.min(t, durationSec));
    }
    stopSources();
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, [durationSec, stopSources]);

  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx || !audioReady) return;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      await ctx.resume();
    }
    startSources(
      curTimeSecRef.current > 0 && curTimeSecRef.current < durationSec
        ? curTimeSecRef.current
        : 0,
    );
    setPlaying(true);
    if (!hasPlayedOnceRef.current) {
      hasPlayedOnceRef.current = true;
      setHasPlayedOnce(true);
    }
  }, [audioReady, durationSec, startSources]);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      pause();
    } else {
      await play();
    }
  }, [pause, play]);

  const setVol = useCallback((key: string, value: number) => {
    setVols((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    applyVols();
  }, [applyVols, vols]);

  useEffect(() => {
    let cancelled = false;
    setAudioLoading(true);
    setAudioError(null);

    void (async () => {
      try {
        const res = await fetch('/api/landing/demo');
        if (!res.ok) throw new Error('Failed to load demo');
        const data = (await res.json()) as LandingDemoResponse;
        if (cancelled) return;
        setDemo(data);

        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const decoded = await Promise.all(
          data.stems.map(async (s) => {
            const response = await fetch(s.url);
            if (!response.ok) throw new Error(`Failed to fetch stem ${s.instrument}`);
            const ab = await response.arrayBuffer();
            const buffer = await ctx.decodeAudioData(ab);
            return { instrument: s.instrument, buffer };
          }),
        );

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

        const maxDuration = decoded.reduce((max, item) => Math.max(max, item.buffer.duration), 0);
        const resolvedDuration = maxDuration > 0 ? maxDuration : data.song.durationSeconds;
        setDurationSec(resolvedDuration);
        setLoadedStems(decoded.map((d) => d.instrument));
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
        safeCloseAudioContext(ctxRef.current);
        ctxRef.current = null;
      }
    };
  }, [applyVols, stopSources]);

  useEffect(() => {
    if (!playing || !audioReady) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const elapsed = Math.max(0, ctx.currentTime - playStartCtxRef.current);
      const t = startTimeRef.current + elapsed;

      if (t >= durationSec) {
        setCurTimeSec(durationSec);
        pause();
        return;
      }

      setCurTimeSec(t);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, audioReady, durationSec, pause]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onPointerDown = () => {
      if (hasPlayedOnceRef.current || !audioReady) return;
      void play();
    };

    el.addEventListener('pointerdown', onPointerDown);
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, [audioReady, play, sectionRef]);

  return {
    demo,
    vols,
    setVol,
    playing,
    curTimeSec,
    durationSec,
    audioReady,
    audioLoading,
    audioError,
    loadedStems,
    hasPlayedOnce,
    toggle,
    play,
    pause,
  };
}
