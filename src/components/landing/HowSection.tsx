'use client';

import { useT } from '@/i18n/context';
import { IconUpload, IconSpark, IconNote } from '@/components/ui/icons';

export function HowSection() {
  const { t } = useT();

  const steps = [
    { icon: <IconUpload size={22} />, tKey: 'how.s1t', bKey: 'how.s1b' },
    { icon: <IconSpark size={22} />, tKey: 'how.s2t', bKey: 'how.s2b' },
    { icon: <IconNote size={22} />, tKey: 'how.s3t', bKey: 'how.s3b' },
  ];

  return (
    <section id="how" className="section" style={{ background: 'var(--surface)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="eyebrow">{t('how.eyebrow')}</p>
          <h2 className="h2" style={{ marginTop: 12 }}>{t('how.title')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {steps.map((s, i) => (
            <div key={i} className="card" style={{ padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
                display: 'grid', placeItems: 'center', color: 'var(--acc)', marginBottom: 16,
              }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-3)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                0{i + 1}
              </p>
              <h3 className="h3" style={{ marginBottom: 8 }}>{t(s.tKey)}</h3>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t(s.bKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
