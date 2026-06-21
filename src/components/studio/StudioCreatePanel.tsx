'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import { STUDIO_GENRES, STUDIO_STEMS } from '@/components/studio/studio-data';
import { IconCheck, IconSpark } from './studio-icons';

import type { StemKey } from '@/types/studio';

interface Props {
  genre: string | null;
  setGenre: (g: string | null) => void;
  stems: StemKey[];
  toggleStem: (id: StemKey) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  remaining: number;
  generating: boolean;
  onGenerate: () => void;
}

export function StudioCreatePanel({
  genre,
  setGenre,
  stems,
  toggleStem,
  prompt,
  setPrompt,
  remaining,
  generating,
  onGenerate,
}: Props) {
  const { t } = useT();
  const noCredits = remaining <= 0;
  const canGen = prompt.trim().length > 0 && !noCredits;

  return (
    <div className="create-panel">
      <div className="create-head">
        <h1 className="canvas-h1">{t('studio.createTitle')}</h1>
        <p className="canvas-sub">{t('studio.createSub')}</p>
      </div>

      <div className="create-field">
        <div className="field-cap">{t('studio.createStep1')}</div>
        <div className="chip-row">
          {STUDIO_GENRES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`sel-chip${genre === g.id ? ' on' : ''}`}
              onClick={() => setGenre(genre === g.id ? null : g.id)}
            >
              {t(g.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="create-field">
        <div className="field-cap">{t('studio.createStep2')}</div>
        <div className="chip-row">
          {STUDIO_STEMS.map((s) => {
            const on = stems.includes(s.stem);
            const Icon = s.Icon;
            return (
              <button
                key={s.stem}
                type="button"
                className={`sel-chip chip-ico${on ? ' on' : ''}`}
                onClick={() => toggleStem(s.stem)}
              >
                <Icon size={15} sw={1.6} /> {t(`inst.${s.stem}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="create-field">
        <div className="field-cap">{t('studio.promptTitle')}</div>
        <textarea
          className="input studio-textarea"
          placeholder={t('studio.promptPh')}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          autoFocus
          disabled={generating}
        />
      </div>

      <div className="create-foot">
        <Button
          type="button"
          size="lg"
          loading={generating}
          disabled={!canGen}
          onClick={onGenerate}
        >
          <IconSpark size={16} /> {t('studio.generate')}
        </Button>
        <span className="foot-note">
          {noCredits ? (
            <Link href="/profile#plans" className="cb-link">
              {t('studio.noCreditsInline')}
            </Link>
          ) : (
            <>
              <IconCheck size={13} /> {t('studio.creditCost')}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
