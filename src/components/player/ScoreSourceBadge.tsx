'use client';

import { useT } from '@/i18n/context';
import type { InstrumentKey, ScoreNote } from '@/lib/data';
import { isScoreUnavailable, resolveScoreQuality } from '@/lib/score-quality';

type ScoreSourceBadgeProps = {
  fromDb: boolean;
  isDemo: boolean;
  instrument: InstrumentKey;
  noteCount?: number;
  notes?: readonly Pick<ScoreNote, 'quality'>[];
};

export function ScoreSourceBadge({
  fromDb,
  isDemo,
  instrument,
  noteCount = 0,
  notes = [],
}: ScoreSourceBadgeProps) {
  const { t } = useT();

  if (isDemo) {
    return (
      <span className="score-source-badge demo" title={t('player.scoreDemoHint')}>
        {t('player.scoreDemo')}
      </span>
    );
  }

  if (isScoreUnavailable(instrument, notes)) {
    return (
      <span className="score-source-badge empty" title={t('player.scoreUnavailableHint')}>
        {t('player.scoreUnavailable')}
      </span>
    );
  }

  if (fromDb && noteCount > 0) {
    const quality = resolveScoreQuality(instrument, notes);
    const labelKey =
      quality === 'high'
        ? 'player.scoreAiHigh'
        : quality === 'medium'
          ? 'player.scoreAiMedium'
          : 'player.scoreAiDraft';

    const hintKey =
      quality === 'high'
        ? 'player.scoreAiHighHint'
        : quality === 'medium'
          ? 'player.scoreAiMediumHint'
          : 'player.scoreAiDraftHint';

    return (
      <span className="score-source-badge real" title={t(hintKey)}>
        {t(labelKey)}
      </span>
    );
  }

  return (
    <span className="score-source-badge empty" title={t('player.scoreEmptyHint')}>
      {t('player.scoreStatic')}
    </span>
  );
}
