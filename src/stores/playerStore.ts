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
  setAudioReady: (ready: boolean) => void;
  setAudioLoading: (loading: boolean) => void;
  setAudioError: (error: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurBeat: (beat: number) => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  audioReady: false,
  audioLoading: false,
  audioError: null,
  playing: false,
  curBeat: 0,
  setAudioReady: (audioReady) => set({ audioReady }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  setAudioError: (audioError) => set({ audioError }),
  setPlaying: (playing) => set({ playing }),
  setCurBeat: (curBeat) => set({ curBeat }),
  reset: () => set({
    audioReady: false,
    audioLoading: false,
    audioError: null,
    playing: false,
    curBeat: 0,
  }),
}));
