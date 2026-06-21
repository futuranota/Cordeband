'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { useLandingStemDemo } from '@/hooks/useLandingStemDemo';
import { WaveformDemo } from '@/components/landing/WaveformDemo';
import { STEMS, fmtTime } from '@/lib/data';
import { STEM_DEF_VOL } from '@/hooks/usePlayerAudio';
import { IconPlay, IconPause, IconVolume, IconMute } from '@/components/ui/icons';

export function StemPreviewSection() {
  const { t } = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const {
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
  } = useLandingStemDemo(sectionRef);

  const progress = durationSec > 0 ? Math.min(1, curTimeSec / durationSec) : 0;
  const stems = STEMS.filter((s) => loadedStems.length === 0 || loadedStems.includes(s.key));
  const displayStems = stems.length ? stems : STEMS;
  const songTitle = demo?.song.title ?? t('stemDemo.fallbackTitle');
  const songArtist = demo?.song.artist ?? 'Cordeband Sessions';

  return (
    <section id="stem-demo" className="section stem-demo-section" ref={sectionRef}>
      <div className="stem-demo-glow wrap">
        <header className="stem-demo-hero-head">
          <p className="eyebrow">{t('stemDemo.eyebrow')}</p>
          <h2 className="h2 stem-demo-title">{t('stemDemo.title')}</h2>
          <p className="lead stem-demo-sub">{t('stemDemo.sub')}</p>
        </header>

        <article className="stem-demo-panel">
          <div className="stem-demo-shell">
            <div className="stem-demo-meta">
              <div>
                <div className="stem-demo-meta-label">{t('stemDemo.nowPlaying')}</div>
                <div className="stem-demo-meta-title">{songTitle}</div>
                <div className="stem-demo-meta-artist">{songArtist}</div>
              </div>
              <span className="stem-demo-time tnum">{fmtTime(curTimeSec)}</span>
            </div>

            <div className="stem-demo-player">
              <button
                type="button"
                className="stem-demo-play"
                aria-label={playing ? 'Pause' : 'Play'}
                disabled={audioLoading || (!audioReady && !audioError)}
                onClick={() => void toggle()}
              >
                {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
              </button>
              <WaveformDemo playing={playing} progress={progress} />
            </div>

            {!hasPlayedOnce && audioReady && !audioLoading && (
              <p className="stem-demo-play-hint">{t('stemDemo.playHint')}</p>
            )}

            {audioError && (
              <p className="stem-demo-play-hint stem-demo-play-hint--warn">{audioError}</p>
            )}

            <div className="stem-demo-stem-grid">
              {displayStems.map((s) => {
                const Icon = s.Icon;
                const vol = vols[s.key] ?? STEM_DEF_VOL[s.key] ?? 70;
                const muted = vol === 0;
                const pct = Math.round(vol);
                return (
                  <div key={s.key} className={`stem-demo-row${muted ? ' is-muted' : ''}`}>
                    <button
                      type="button"
                      className={`stem-demo-mute${muted ? ' active' : ''}`}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                      onClick={() => setVol(s.key, muted ? (STEM_DEF_VOL[s.key] ?? 70) : 0)}
                    >
                      {muted ? <IconMute size={14} /> : <IconVolume size={14} />}
                    </button>
                    <span className="stem-demo-inst-btn" aria-hidden="true">
                      <Icon size={36} />
                    </span>
                    <div className="stem-demo-slider-wrap">
                      <input
                        className="slider stem-demo-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={vol}
                        style={{ '--range-value': `${pct}%` } as React.CSSProperties}
                        onChange={(e) => setVol(s.key, Number(e.target.value))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link href="/signup?plan=free" className="btn stem-demo-cta">
            {t('stemDemo.cta')} →
          </Link>
        </article>
      </div>
    </section>
  );
}
