'use client';

import { useT } from '@/i18n/context';
import { INSTRUMENTS } from '@/lib/data';
import type { TimelineLane } from '@/lib/band-timeline';

type BandTimelineProps = {
  lanes: TimelineLane[];
  totalBeats: number;
  curBeat: number;
  youInstrument?: string | null;
};

export function BandTimeline({ lanes, totalBeats, curBeat, youInstrument }: BandTimelineProps) {
  const { t } = useT();

  if (lanes.length === 0 || totalBeats <= 0) return null;

  const ratio = Math.min(1, Math.max(0, curBeat / totalBeats));

  return (
    <div className="band-timeline" aria-label={t('bandTimeline.whoPlays')}>
      <p className="band-timeline-label">{t('bandTimeline.whoPlays')}</p>
      <div className="band-timeline-rows">
        {lanes.map((lane) => {
          const { Icon } = INSTRUMENTS[lane.instrument];
          const isYou = youInstrument === lane.instrument;
          return (
            <div
              key={lane.id}
              className={`band-timeline-row${isYou ? ' you' : ''}`}
              style={{ '--lane-hue': `${(lane.laneIndex * 47) % 360}` } as React.CSSProperties}
            >
              <div className="band-timeline-meta">
                <span className="band-timeline-avatar">{lane.name[0]?.toUpperCase()}</span>
                <span className="band-timeline-name" title={lane.name}>
                  {lane.name}
                </span>
                <span className="band-timeline-inst">
                  <Icon size={11} sw={1.5} />
                </span>
              </div>
              <div className="band-timeline-track">
                {lane.windows.map((w, i) => (
                  <div
                    key={i}
                    className="band-timeline-seg"
                    style={{
                      left: `${(w.startBeat / totalBeats) * 100}%`,
                      width: `${((w.endBeat - w.startBeat) / totalBeats) * 100}%`,
                    }}
                  />
                ))}
                <div className="band-timeline-playhead" style={{ left: `${ratio * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
