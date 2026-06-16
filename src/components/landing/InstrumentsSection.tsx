'use client';

import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS } from '@/lib/data';

export function InstrumentsSection() {
  const { t } = useT();

  return (
    <section id="instruments" className="section" style={{ background: 'var(--surface)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p className="eyebrow">{t('instSec.eyebrow')}</p>
          <h2 className="h2" style={{ marginTop: 12 }}>{t('instSec.title')}</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {INST_ORDER.map((key) => {
            const { Icon } = INSTRUMENTS[key];
            return (
              <div key={key} className="card" style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 120 }}>
                <div style={{ color: 'var(--acc)' }}>
                  <Icon size={28} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t(`inst.${key}`)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
