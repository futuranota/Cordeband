'use client';

import { INSTRUMENTS, INST_ORDER, type InstrumentKey } from '@/lib/data';
import { useT } from '@/i18n/context';

type Props = {
  instruments: InstrumentKey[];
  titleKey?: string;
  subKey?: string;
};

export function DetectedInstrumentsBanner({
  instruments,
  titleKey = 'up.detectedTitle',
  subKey = 'up.detectedSub',
}: Props) {
  const { t } = useT();
  const ordered = INST_ORDER.filter((k) => instruments.includes(k));

  if (!ordered.length) return null;

  return (
    <div className="detected-inst" style={{ marginTop: 20 }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{t(titleKey)}</p>
      <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>{t(subKey)}</p>
      <div className="detected-inst-chips">
        {ordered.map((k) => {
          const Icon = INSTRUMENTS[k].Icon;
          return (
            <span key={k} className="detected-inst-chip">
              <Icon size={16} sw={1.5} />
              {t(`inst.${k}`)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
