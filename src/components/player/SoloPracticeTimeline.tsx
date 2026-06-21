'use client';

import { useT } from '@/i18n/context';
import { INSTRUMENTS, type InstrumentKey } from '@/lib/data';
import type { EntryWindow } from '@/lib/band-schedule';
import { isBeatInWindow } from '@/lib/band-schedule';

type SoloPracticeTimelineProps = {
  instrument: InstrumentKey;
  windows: EntryWindow[];
  totalBeats: number;
  curBeat: number;
  fromTranscription?: boolean;
};

export function SoloPracticeTimeline({
  instrument,
  windows,
  totalBeats,
  curBeat,
  fromTranscription = false,
}: SoloPracticeTimelineProps) {
  const { t } = useT();
  const { Icon } = INSTRUMENTS[instrument];

  if (windows.length === 0 || totalBeats <= 0) return null;

  const ratio = Math.min(1, Math.max(0, curBeat / totalBeats));

  return (
    <div className="solo-practice-timeline" aria-label={t('player.timelineLabel')}>
      <div className="solo-practice-timeline-head">
        <span className="solo-practice-timeline-title">{t('player.timelineLabel')}</span>
        {fromTranscription && (
          <span className="solo-practice-timeline-badge">{t('player.timelineFromNotes')}</span>
        )}
      </div>
      <div className="band-timeline-row you">
        <div className="band-timeline-meta">
          <span className="band-timeline-inst">
            <Icon size={14} sw={1.5} />
          </span>
          <span className="band-timeline-name">{t(`inst.${instrument}`)}</span>
        </div>
        <div className="band-timeline-track">
          {windows.map((w, i) => (
            <div
              key={i}
              className={`band-timeline-seg${isBeatInWindow(curBeat, w) ? ' active' : ''}`}
              style={{
                left: `${(w.startBeat / totalBeats) * 100}%`,
                width: `${((w.endBeat - w.startBeat) / totalBeats) * 100}%`,
              }}
              title={`${t('player.timelinePart')} ${i + 1}`}
            />
          ))}
          <div className="band-timeline-playhead" style={{ left: `${ratio * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
