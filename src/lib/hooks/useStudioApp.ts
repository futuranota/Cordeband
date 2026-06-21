'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_STUDIO_RESULT, STUDIO_GENRES } from '@/components/studio/studio-data';
import { PLAN_STUDIO_CREDITS, type PlanId } from '@/lib/plans';
import {
  apiResultToSong,
  readSongs,
  songsStorageKey,
  writeSongs,
} from '@/lib/studio-songs';
import type { StemKey, StudioCompositionResult, StudioMode, StudioSong, StudioView } from '@/types/studio';

interface Options {
  mode: StudioMode;
  initialCredits: number;
  plan: PlanId;
}

export function useStudioApp({ mode, initialCredits, plan }: Options) {
  const total = PLAN_STUDIO_CREDITS[plan] ?? 1;
  const storageKey = songsStorageKey(mode);

  const [credits, setCredits] = useState(initialCredits);
  const [songs, setSongs] = useState<StudioSong[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<StudioView>('intro');
  const [genre, setGenre] = useState<string | null>(null);
  const [stems, setStems] = useState<StemKey[]>([]);
  const [prompt, setPrompt] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [iterating, setIterating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readSongs(storageKey);
    setSongs(stored);
    if (stored.length > 0) {
      setActiveId(stored[0].id);
      setView('work');
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    setCredits(initialCredits);
  }, [initialCredits]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const persistSongs = useCallback((next: StudioSong[]) => {
    setSongs(next);
    writeSongs(storageKey, next);
  }, [storageKey]);

  const activeSong = songs.find((s) => s.id === activeId) ?? null;

  const toTop = useCallback(() => {
    requestAnimationFrame(() => {
      const c = document.querySelector('.studio-canvas');
      if (c) c.scrollTop = 0;
    });
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2400);
  }, []);

  const startCreate = useCallback(() => {
    setGenre(null);
    setStems([]);
    setPrompt('');
    setView('create');
    toTop();
  }, [toTop]);

  const openSong = useCallback((id: string) => {
    setActiveId(id);
    setView('work');
    setSavedFlash(false);
    toTop();
  }, [toTop]);

  const toggleStem = useCallback((id: StemKey) => {
    setStems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  function genreNameFor(id: string | null, t: (k: string) => string): string | null {
    if (!id) return null;
    const g = STUDIO_GENRES.find((x) => x.id === id);
    return g ? t(g.labelKey) : id;
  }

  async function compose(
    genreId: string | null,
    stemKeys: StemKey[],
    description: string,
    t: (k: string) => string,
  ): Promise<StudioSong> {
    const gName = genreNameFor(genreId, t);

    if (mode === 'demo') {
      await new Promise((r) => setTimeout(r, 2200));
      const song = apiResultToSong(MOCK_STUDIO_RESULT, {
        genre: genreId,
        genreName: gName,
        stems: stemKeys,
        prompt: description,
      });
      setCredits((c) => Math.max(0, c - 1));
      return song;
    }

    const res = await fetch('/api/studio/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre: genreId,
        stems: stemKeys.map((stem) => ({ stem, label: t(`inst.${stem}`) })),
        description,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? 'Error al generar la composición.');
    }

    setCredits(json.creditsRemaining ?? 0);
    return apiResultToSong(json.data as StudioCompositionResult, {
      genre: genreId,
      genreName: gName,
      stems: stemKeys,
      prompt: description,
    });
  }

  const generate = useCallback(async (t: (k: string) => string) => {
    if (credits <= 0 || !prompt.trim() || generating) return;
    setGenerating(true);
    toTop();
    try {
      const song = await compose(genre, stems, prompt.trim(), t);
      const next = [song, ...songs];
      persistSongs(next);
      setActiveId(song.id);
      setView('work');
      flashSaved();
      toTop();
    } catch {
      setView('error');
    } finally {
      setGenerating(false);
    }
  }, [credits, prompt, genre, stems, songs, persistSongs, flashSaved, toTop, mode, generating]);

  const editLyrics = useCallback((text: string) => {
    if (!activeId) return;
    persistSongs(songs.map((s) => (s.id === activeId ? { ...s, lyricsText: text } : s)));
  }, [activeId, songs, persistSongs]);

  const iterate = useCallback(async (changePrompt: string, t: (k: string) => string) => {
    if (!activeSong || credits <= 0 || !changePrompt.trim()) return;
    setIterating(true);
    try {
      const combined = `${activeSong.prompt} · ${changePrompt.trim()}`.slice(0, 400);
      const song = await compose(activeSong.genre, activeSong.stems, combined, t);
      persistSongs(songs.map((s) => (s.id === activeId
        ? {
            ...s,
            title: song.title,
            bpm: song.bpm,
            keySig: song.keySig,
            structure: song.structure,
            lyricsText: song.lyricsText,
            sunoPrompt: song.sunoPrompt,
            prompt: combined,
          }
        : s)));
      setIterating(false);
      flashSaved();
    } catch {
      setIterating(false);
      setView('error');
    }
  }, [activeSong, activeId, credits, songs, persistSongs, flashSaved, mode]);

  const backFromError = useCallback(() => {
    setView(songs.length ? 'work' : 'create');
  }, [songs.length]);

  return {
    hydrated,
    total,
    credits,
    plan,
    songs,
    activeId,
    activeSong,
    view,
    setView,
    genre,
    setGenre,
    stems,
    prompt,
    setPrompt,
    savedFlash,
    iterating,
    generating,
    startCreate,
    openSong,
    toggleStem,
    generate,
    editLyrics,
    iterate,
    backFromError,
  };
}
