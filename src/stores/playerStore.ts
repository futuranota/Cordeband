'use client';

import { create } from 'zustand';
import type { InstrumentKey } from '@/lib/data';

export type StemBufferEntry = {
  instrument: InstrumentKey;
  buffer: AudioBuffer;
};

type PlayerStoreState = {
  audioReady: boolean;
  audioLoading: boolean;
  audioError: string | null;
  playing: boolean;
  curBeat: number;
  // ── NUEVO ──────────────────────────────────────────────────────
  // Tiempo real en segundos del AudioContext.
  // Fuente de verdad para highlight de notas cuando hay startTime/endTime en DB.
  // curBeat sigue siendo la fuente para la partitura/cursor/seek.
  curTimeSec: number;
  // ───────────────────────────────────────────────────────────────
  setAudioReady: (ready: boolean) => void;
  setAudioLoading: (loading: boolean) => void;
  setAudioError: (error: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurBeat: (beat: number) => void;
  setCurTimeSec: (sec: number) => void; // NUEVO
  reset: () => void;
};

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  audioReady: false,
  audioLoading: false,
  audioError: null,
  playing: false,
  curBeat: 0,
  curTimeSec: 0, // NUEVO
  setAudioReady: (audioReady) => set({ audioReady }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  setAudioError: (audioError) => set({ audioError }),
  setPlaying: (playing) => set({ playing }),
  setCurBeat: (curBeat) => set({ curBeat }),
  setCurTimeSec: (curTimeSec) => set({ curTimeSec }), // NUEVO
  reset: () => set({
    audioReady: false,
    audioLoading: false,
    audioError: null,
    playing: false,
    curBeat: 0,
    curTimeSec: 0, // NUEVO
  }),
}));
