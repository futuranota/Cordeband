'use client';

import { useT } from '@/i18n/context';
import { fmtTime } from '@/lib/data';
import type { EntryWindow } from '@/lib/band-schedule';
import { isBeatInWindow } from '@/lib/band-schedule';

type LyricsViewerProps = {
  windows: EntryWindow[];
  curBeat: number;
  bpm: number;
  playing: boolean;
  waiting: boolean;
  waitLabel?: string;
  loading?: boolean;
  fromTranscription?: boolean;
};

function beatToSeconds(beat: number, bpm: number): number {
  return beat * 60 / Math.max(bpm, 1);
}

export function LyricsViewer({
  windows,
  curBeat,
  bpm,
  playing,
  waiting,
  waitLabel,
  loading,
  fromTranscription = false,
}: LyricsViewerProps) {
  const { t } = useT();

  const activeIndex = windows.findIndex((w) => isBeatInWindow(curBeat, w));
  const nextIndex = windows.findIndex((w) => w.startBeat > curBeat);

  return (
    <div className={`lyrics-viewer sheet${waiting && playing ? ' waiting-part' : ''}`}>
      <div className="lyrics-viewer-head">
        <span className="lyrics-viewer-eyebrow">{t('player.lyricsView')}</span>
        {fromTranscription ? (
          <span className="score-source-badge real">{t('player.scoreReal')}</span>
        ) : (
          <span className="score-source-badge demo">{t('player.scoreDemo')}</span>
        )}
      </div>

      {loading && (
        <div className="sheet-loading" style={{ position: 'relative', minHeight: 160 }}>
          <div className="muted" style={{ fontSize: 13.5 }}>{t('player.lyricsLoading')}</div>
        </div>
      )}

      {!loading && windows.length === 0 && (
        <div className="lyrics-empty">
          <p>{t('player.lyricsEmpty')}</p>
        </div>
      )}

      {!loading && windows.length > 0 && (
        <div className="lyrics-lines">
          {windows.map((w, i) => {
            const isActive = i === activeIndex;
            const isPast = w.endBeat <= curBeat;
            const isNext = i === nextIndex;
            const startSec = beatToSeconds(w.startBeat, bpm);
            const endSec = beatToSeconds(w.endBeat, bpm);
            return (
              <div
                key={i}
                className={`lyrics-line${isActive ? ' active' : ''}${isPast ? ' past' : ''}${isNext && !isActive ? ' next' : ''}`}
              >
                <span className="lyrics-line-time">
                  {fmtTime(startSec)} – {fmtTime(endSec)}
                </span>
                <span className="lyrics-line-text">
                  {isActive && playing
                    ? t('player.lyricsSingNow')
                    : t('player.lyricsPart').replace('{n}', String(i + 1))}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!fromTranscription && (
        <p className="lyrics-note muted">{t('player.lyricsDemoNote')}</p>
      )}
      {fromTranscription && (
        <p className="lyrics-note muted">{t('player.lyricsTranscriptionNote')}</p>
      )}

      {waiting && playing && waitLabel && (
        <div className="sheet-wait-overlay"><span>{waitLabel}</span></div>
      )}
    </div>
  );
}
