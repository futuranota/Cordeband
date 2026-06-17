'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n/context';
import { INSTRUMENTS, INST_ORDER, type InstrumentKey } from '@/lib/data';

const STAGE_ORDER: InstrumentKey[] = ['guitar', 'piano', 'drums', 'bass', 'vocals', 'other'];
const STAGE_BACK = new Set<InstrumentKey>(['drums', 'bass']);

type BandStageProps = {
  instruments: InstrumentKey[];
  youKey?: InstrumentKey | null;
  activeKeys?: InstrumentKey[] | null;
  memberLabels?: Partial<Record<InstrumentKey, string>>;
};

function BandStage({ instruments, youKey, activeKeys, memberLabels }: BandStageProps) {
  const { t } = useT();
  const present = STAGE_ORDER.filter((k) => instruments.includes(k));
  const controlled = Array.isArray(activeKeys);

  const [demoIdx, setDemoIdx] = useState(0);
  useEffect(() => {
    if (controlled) return;
    const id = setInterval(() => setDemoIdx((i) => (i + 1) % Math.max(1, present.length)), 1200);
    return () => clearInterval(id);
  }, [controlled, present.length]);

  const isPlaying = (k: InstrumentKey, i: number) =>
    controlled ? (activeKeys?.includes(k) ?? false) : i === demoIdx;

  return (
    <div className="stage-floor">
      {present.map((k, i) => {
        const { Icon } = INSTRUMENTS[k];
        const playing = isPlaying(k, i);
        const you = k === youKey;
        const memberName = memberLabels?.[k];
        return (
          <div
            key={k}
            className={`stage-spot${STAGE_BACK.has(k) ? ' back' : ''}${playing ? ' playing' : ''}${you ? ' you' : ''}${memberName ? ' named' : ''}`}
          >
            <div className="stage-pad">
              {you && <span className="stage-youtag">{t('band.you').toUpperCase()}</span>}
              <span className="pulse" />
              <Icon size={34} sw={1.4} />
            </div>
            {memberName ? (
              <>
                <span className="stage-name">{memberName}</span>
                <span className="stage-label stage-label-sub">{t(`inst.${k}`)}</span>
              </>
            ) : (
              <span className="stage-label">{t(`inst.${k}`)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

type StagePanelProps = {
  instruments: InstrumentKey[];
  youKey?: InstrumentKey | null;
  activeKeys?: InstrumentKey[] | null;
  memberLabels?: Partial<Record<InstrumentKey, string>>;
  title?: string;
  sub?: string;
};

export function StagePanel({ instruments, youKey, activeKeys, memberLabels, title, sub }: StagePanelProps) {
  return (
    <div className="stageviz">
      <div className="stageviz-beam" />
      {(title || sub) && (
        <div className="stageviz-head">
          <div>
            {title && <div className="h3">{title}</div>}
            {sub && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
          </div>
        </div>
      )}
      <BandStage instruments={instruments} youKey={youKey} activeKeys={activeKeys} memberLabels={memberLabels} />
    </div>
  );
}

export { INST_ORDER };
