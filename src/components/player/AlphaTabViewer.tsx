'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { beatToTickPosition } from '@/lib/alphatab/notes-to-alphatex';
import { DARK_ALPHATAB_RESOURCES } from '@/lib/alphatab/dark-theme-resources';
import { IconSpark } from '@/components/ui/icons';

const FONT_CDN = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.3/dist/font/';
const COMPACT_H = 230;

type AlphaTabApi = {
  tex: (tex: string) => void;
  tickPosition: number;
  destroy: () => void;
};

export type AlphaTabViewMode = 'compact' | 'klangio';

type AlphaTabViewerProps = {
  alphaTex: string;
  curBeat: number;
  mode?: AlphaTabViewMode;
  loading?: boolean;
  waiting?: boolean;
  waitLabel?: string;
  fallback?: ReactNode;
  aiCaveat?: boolean;
  aiCaveatLabel?: string;
};

export function AlphaTabViewer({
  alphaTex,
  curBeat,
  mode = 'compact',
  loading,
  waiting,
  waitLabel,
  fallback,
  aiCaveat,
  aiCaveatLabel,
}: AlphaTabViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !alphaTex) return;

    let api: AlphaTabApi | null = null;
    let cancelled = false;
    setReady(false);
    setFailed(false);

    void import('@coderline/alphatab').then((alphaTab) => {
      if (cancelled || !containerRef.current) return;

      try {
        api = new alphaTab.AlphaTabApi(containerRef.current, {
          core: {
            useWorkers: false,
            fontDirectory: FONT_CDN,
          },
          player: {
            enablePlayer: false,
            enableCursor: true,
            enableUserInteraction: false,
          },
          display: {
            scale: mode === 'klangio' ? 1.0 : 0.9,
            layoutMode: 'page',
            resources: DARK_ALPHATAB_RESOURCES,
          },
        }) as AlphaTabApi;

        api.tex(alphaTex);
        apiRef.current = api;
        setReady(true);
      } catch {
        setFailed(true);
      }
    }).catch(() => setFailed(true));

    return () => {
      cancelled = true;
      api?.destroy();
      apiRef.current = null;
    };
  }, [alphaTex, mode]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !ready) return;
    api.tickPosition = beatToTickPosition(curBeat);
    if (mode !== 'klangio') return;
    // Auto-scroll the cursor into view for Klangio-style vertical playback.
    const wrap = wrapRef.current;
    const cursorEl = wrap?.querySelector('.at-cursor-beat') as HTMLElement | null;
    if (wrap && cursorEl) {
      const wrapRect = wrap.getBoundingClientRect();
      const cursorRect = cursorEl.getBoundingClientRect();
      const offsetWithinWrap = cursorRect.top - wrapRect.top + wrap.scrollTop;
      const target = offsetWithinWrap - wrap.clientHeight * 0.35;
      wrap.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }, [curBeat, ready, mode]);

  if (failed) return fallback ? <>{fallback}</> : null;

  const isKlangio = mode === 'klangio';
  const wrapClass = `sheet alphatab-sheet${isKlangio ? ' alphatab-klangio' : ''}${waiting ? ' waiting-part' : ''}${aiCaveat ? ' score-ai-caveat' : ''}`;
  const wrapStyle = isKlangio
    ? { maxHeight: '70vh', overflowY: 'auto' as const }
    : { height: COMPACT_H };
  const innerStyle = isKlangio
    ? { width: '100%' }
    : { width: '100%', height: COMPACT_H, overflow: 'hidden' as const };

  return (
    <div ref={wrapRef} className={wrapClass} style={wrapStyle}>
      <div
        ref={containerRef}
        className="alphatab-container"
        style={innerStyle}
      />
      {loading && (
        <div className="sheet-loading">
          <IconSpark size={28} style={{ color: 'var(--acc)' }} />
          <div className="muted" style={{ fontSize: 13.5 }}>Cargando partitura…</div>
          <div className="sheet-loadbar"><i className="load-anim" /></div>
        </div>
      )}
      {waiting && !loading && waitLabel && (
        <div className="sheet-wait-overlay"><span>{waitLabel}</span></div>
      )}
      {aiCaveat && !loading && !isKlangio && (
        <div className="sheet-ai-overlay" aria-hidden="true">
          <span className="sheet-ai-watermark">{aiCaveatLabel}</span>
        </div>
      )}
    </div>
  );
}
