'use client';

import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS } from '@/lib/data';

export function InstrumentsSection() {
  const { t } = useT();

  return (
    <section id="instruments" className="section-tight wrap">
      <div className="row spread" style={{ flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
        <div className="section-head">
          <p className="eyebrow">{t('instSec.eyebrow')}</p>
          <h2 className="h2" style={{ marginTop: 14 }}>{t('instSec.title')}</h2>
        </div>
        <div className="inst-strip">
          {INST_ORDER.map((key) => {
            const { Icon } = INSTRUMENTS[key];
            return (
              <span key={key} className="pill" style={{ padding: '9px 14px' }}>
                <Icon size={15} sw={1.5} />
                {t(`inst.${key}`)}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
