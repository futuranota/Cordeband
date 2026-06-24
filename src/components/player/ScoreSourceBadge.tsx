'use client';

import { useT } from '@/i18n/context';
import type { InstrumentKey, ScoreNote } from '@/lib/data';
import {
  isScoreUnavailable,
  resolveScoreQuality,
  resolveTranscriptionTrust,
} from '@/lib/score-quality';

type ScoreSourceBadgeProps = {
  fromDb: boolean;
  isDemo: boolean;
  instrument: InstrumentKey;
  noteCount?: number;
  notes?: readonly Pick<ScoreNote, 'quality' | 'confidence' | 'source'>[];
  midiFilename?: string | null;
};

export function ScoreSourceBadge({
  fromDb,
  isDemo,
  instrument,
  noteCount = 0,
  notes = [],
  midiFilename,
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
    const trust = resolveTranscriptionTrust(instrument, notes);
    const isUserMidi = notes.some((n) => n.source === 'user_upload');

    if (isUserMidi) {
      const label = midiFilename
        ? `📋 ${midiFilename}`
        : t('player.scoreUserMidi');
      return (
        <span className="score-source-badge uncertain" title={t('player.scoreUserMidiHint')}>
          {label}
        </span>
      );
    }

    if (trust === 'trusted') {
      return (
        <span className="score-source-badge trusted" title={t('scoreQuality.trustedHint')}>
          {t('scoreQuality.trusted')}
        </span>
      );
    }

    const quality = resolveScoreQuality(instrument, notes);
    const labelKey =
      quality === 'high'
        ? 'player.scoreAiHigh'
        : quality === 'medium'
          ? 'player.scoreAiMedium'
          : 'player.scoreAiDraft';

    const hintKey =
      trust === 'uncertain'
        ? 'scoreQuality.uncertainHint'
        : quality === 'high'
          ? 'player.scoreAiHighHint'
          : quality === 'medium'
            ? 'player.scoreAiMediumHint'
            : 'player.scoreAiDraftHint';

    return (
      <span className="score-source-badge uncertain" title={t(hintKey)}>
        {trust === 'uncertain' ? t('scoreQuality.uncertain') : t(labelKey)}
      </span>
    );
  }

  return (
    <span className="score-source-badge empty" title={t('player.scoreEmptyHint')}>
      {t('player.scoreStatic')}
    </span>
  );
}
