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
};

function BandStage({ instruments, youKey, activeKeys }: BandStageProps) {
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
        return (
          <div
            key={k}
            className={`stage-spot${STAGE_BACK.has(k) ? ' back' : ''}${playing ? ' playing' : ''}${you ? ' you' : ''}`}
          >
            <div className="stage-pad">
              {you && <span className="stage-youtag">{t('band.you').toUpperCase()}</span>}
              <span className="pulse" />
              <Icon size={34} sw={1.4} />
            </div>
            <span className="stage-label">{t(`inst.${k}`)}</span>
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
  title?: string;
  sub?: string;
};

export function StagePanel({ instruments, youKey, activeKeys, title, sub }: StagePanelProps) {
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
      <BandStage instruments={instruments} youKey={youKey} activeKeys={activeKeys} />
    </div>
  );
}

export { INST_ORDER };
