'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { beatToTickPosition } from '@/lib/alphatab/notes-to-alphatex';
import { DARK_ALPHATAB_RESOURCES } from '@/lib/alphatab/dark-theme-resources';
import { IconSpark } from '@/components/ui/icons';

const FONT_CDN = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.3/dist/font/';
const SHEET_H = 230;

type AlphaTabApi = {
  tex: (tex: string) => void;
  tickPosition: number;
  destroy: () => void;
};

type AlphaTabViewerProps = {
  alphaTex: string;
  curBeat: number;
  loading?: boolean;
  waiting?: boolean;
  waitLabel?: string;
  fallback?: ReactNode;
};

export function AlphaTabViewer({
  alphaTex,
  curBeat,
  loading,
  waiting,
  waitLabel,
  fallback,
}: AlphaTabViewerProps) {
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
            scale: 0.9,
            layoutMode: 'page',
            resources: DARK_ALPHATAB_RESOURCES,
          },
        }) as AlphaTabApi;

        api.tex(alphaTex);
        apiRef.current = api;
        setReady(true);
        // #region agent log
        fetch('http://127.0.0.1:7513/ingest/af9b1d32-4cd2-4edf-9e4f-7af87a58ddb5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7dccd2'},body:JSON.stringify({sessionId:'7dccd2',location:'AlphaTabViewer.tsx:71',message:'alphaTab parse ok',data:{texLines:alphaTex.split('\n').length,staffLine:alphaTex.split('\n').find(l=>l.includes('staff'))},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7513/ingest/af9b1d32-4cd2-4edf-9e4f-7af87a58ddb5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7dccd2'},body:JSON.stringify({sessionId:'7dccd2',location:'AlphaTabViewer.tsx:76',message:'alphaTab parse failed',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setFailed(true);
      }
    }).catch(() => setFailed(true));

    return () => {
      cancelled = true;
      api?.destroy();
      apiRef.current = null;
    };
  }, [alphaTex]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !ready) return;
    api.tickPosition = beatToTickPosition(curBeat);
  }, [curBeat, ready]);

  if (failed) return fallback ? <>{fallback}</> : null;

  return (
    <div className={`sheet alphatab-sheet${waiting ? ' waiting-part' : ''}`} style={{ height: SHEET_H }}>
      <div
        ref={containerRef}
        className="alphatab-container"
        style={{ width: '100%', height: SHEET_H, overflow: 'hidden' }}
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
    </div>
  );
}
