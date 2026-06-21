'use client';

import { useT } from '@/i18n/context';

type ScoreSourceBadgeProps = {
  fromDb: boolean;
  isDemo: boolean;
  noteCount?: number;
};

export function ScoreSourceBadge({ fromDb, isDemo, noteCount = 0 }: ScoreSourceBadgeProps) {
  const { t } = useT();

  if (isDemo) {
    return (
      <span className="score-source-badge demo" title={t('player.scoreDemoHint')}>
        {t('player.scoreDemo')}
      </span>
    );
  }

  if (fromDb && noteCount > 0) {
    return (
      <span className="score-source-badge real" title={t('player.scoreRealHint')}>
        {t('player.scoreReal')} · {noteCount} {t('player.scoreNotes')}
      </span>
    );
  }

  return (
    <span className="score-source-badge empty" title={t('player.scoreEmptyHint')}>
      {t('player.scoreStatic')}
    </span>
  );
}
