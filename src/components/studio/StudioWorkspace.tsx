'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import { SUNO_URL } from '@/lib/studio-config';
import type { StudioSong } from '@/types/studio';
import { StudioCopyButton } from './StudioCopyButton';
import { IconEdit, IconExternal, IconLoop, IconSpark } from './studio-icons';

interface Props {
  song: StudioSong;
  onEditLyrics: (text: string) => void;
  onIterate: (changePrompt: string) => void;
  iterating: boolean;
  remaining: number;
  savedFlash: boolean;
  mode: 'demo' | 'live';
}

export function StudioWorkspace({
  song,
  onEditLyrics,
  onIterate,
  iterating,
  remaining,
  savedFlash,
  mode,
}: Props) {
  const { t } = useT();
  const [iter, setIter] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const noCredits = remaining <= 0;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(280, ta.scrollHeight)}px`;
  }, [song.id, song.lyricsText]);

  function doIterate() {
    if (!iter.trim() || noCredits) return;
    onIterate(iter.trim());
    setIter('');
  }

  return (
    <div className="workspace">
      <div className="work-head">
        <div className="work-head-main">
          <div className="work-tags">
            {song.genreName && <span className="mini-tag">{song.genreName}</span>}
            {song.stems.map((id) => (
              <span key={id} className="mini-tag">{t(`inst.${id}`)}</span>
            ))}
            {savedFlash && (
              <span className="saved-flash">
                <span aria-hidden>✓</span> {t('studio.justSaved')}
              </span>
            )}
          </div>
          <h1 className="work-title">{song.title}</h1>
          <div className="work-meta">{song.bpm} BPM · {song.keySig}</div>
        </div>
      </div>

      <div className="work-grid">
        <div className="work-main">
          <div className="work-block-head">
            <h3>{t('studio.workLyrics')}</h3>
            <div className="row gap-8">
              <span className="edit-hint">
                <IconEdit size={13} /> {t('studio.lyricsEditable')}
              </span>
              {song.lyricsText && <StudioCopyButton text={song.lyricsText} small />}
            </div>
          </div>
          {song.instrumental ? (
            <div className="lyric-box" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
              {t('studio.instrumentalNote')}
            </div>
          ) : (
            <textarea
              ref={taRef}
              className="lyric-edit"
              value={song.lyricsText}
              onChange={(e) => onEditLyrics(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>

        <div className="work-rail">
          <div className="rail-block">
            <div className="rail-cap">{t('studio.workStructure')}</div>
            <div className="struct-list compact">
              {song.structure.map((r, i) => (
                <div className="struct-row" key={i}>
                  <span className={`struct-tag ${r.cls}`}>{r.tag}</span>
                  <span className="struct-desc">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rail-block iterate-block">
            <div className="rail-cap">
              <IconLoop size={13} /> {t('studio.iterateTitle')}
            </div>
            <p className="rail-sub">{t('studio.iterateSub')}</p>
            <textarea
              className="input iterate-ta"
              placeholder={t('studio.iteratePh')}
              value={iter}
              onChange={(e) => setIter(e.target.value)}
              disabled={iterating}
            />
            <Button
              type="button"
              size="sm"
              className="w-full"
              loading={iterating}
              disabled={!iter.trim() || noCredits}
              onClick={doIterate}
            >
              <IconSpark size={15} /> {t('studio.iterateBtn')}
            </Button>
            <span className="rail-note">
              {noCredits ? (
                <Link href={mode === 'demo' ? '/signup?plan=free' : '/profile#plans'} className="cb-link">
                  {t('studio.noCredits')} · {t('studio.seePricing')}
                </Link>
              ) : (
                t('studio.iterateCost')
              )}
            </span>
          </div>

          <div className="rail-block suno-rail">
            <div className="rail-cap">
              <IconSpark size={13} /> {t('studio.sunoLabel')}
            </div>
            <div className="suno-text">{song.sunoPrompt}</div>
            <div className="suno-actions">
              <StudioCopyButton text={song.sunoPrompt} label={t('studio.copyPrompt')} small />
              <Button asChild size="sm">
                <a
                  href={`${SUNO_URL}/create`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('studio.openSuno')} <IconExternal size={13} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
