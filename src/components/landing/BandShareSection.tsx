'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { InstGuitar, InstPiano, InstBass, InstDrums, InstVocals } from '@/components/ui/icons';
import Link from 'next/link';

const ROSTER = [
  { Icon: InstGuitar, nameKey: 'band.m1', taken: true },
  { Icon: InstPiano,  nameKey: 'band.m2', taken: true },
  { Icon: InstBass,   nameKey: 'band.m3', taken: true },
  { Icon: InstDrums,  nameKey: 'band.you', taken: true },
  { Icon: InstVocals, nameKey: '',         taken: false },
];

export function BandShareSection() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const fakeLink = 'cordeband.com/sala/BND-4X9';

  function copy() {
    navigator.clipboard.writeText(fakeLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section id="band" className="section">
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <p className="eyebrow">{t('band.eyebrow')}</p>
          <h2 className="h2" style={{ marginTop: 12 }}>{t('band.title')}</h2>
          <p className="lead" style={{ marginTop: 16 }}>{t('band.sub')}</p>
          <Link href="/signup" className="btn btn-primary" style={{ marginTop: 28 }}>
            {t('band.cta')}
          </Link>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{t('band.note')}</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', margin: '0 0 8px' }}>
            {t('band.linkLabel')}
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              readOnly
              value={fakeLink}
              className="input"
              style={{ fontSize: 13 }}
            />
            <button onClick={copy} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
              {copied ? t('band.copied') : t('band.copy')}
            </button>
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('band.rosterTitle')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ROSTER.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: m.taken ? 'var(--acc-soft)' : 'var(--elev-2)',
                  border: `1px solid ${m.taken ? 'var(--acc-line)' : 'var(--line)'}`,
                  display: 'grid', placeItems: 'center',
                  color: m.taken ? 'var(--acc)' : 'var(--text-3)',
                }}>
                  <m.Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  {m.taken ? (
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {m.nameKey ? t(m.nameKey) : ''} {i === 3 ? `(${t('common.you')})` : ''}
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>{t('band.open')}</span>
                  )}
                </div>
                {m.taken && (
                  <span className="pill pill-ink" style={{ fontSize: 11 }}>{t('band.taken')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
