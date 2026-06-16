'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';

const SONG = LIBRARY[0];

export function InstrumentScreen() {
  const { t } = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<InstrumentKey>('guitar');

  return (
    <div className="wrap page" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 760 }}>
      <h1 className="h2" style={{ marginBottom: 8 }}>{t('sel.whatPlay')}</h1>
      <p className="lead" style={{ fontSize: 15, marginBottom: 36 }}>{t('sel.sub')}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 36 }}>
        {INST_ORDER.map(key => {
          const { Icon } = INSTRUMENTS[key];
          const detected = SONG?.instruments.includes(key);
          const active = selected === key;
          return (
            <button
              key={key}
              onClick={() => detected && setSelected(key)}
              disabled={!detected}
              style={{
                background: active ? 'var(--acc-soft)' : 'var(--elev)',
                border: `1px solid ${active ? 'var(--acc-line)' : 'var(--line)'}`,
                borderRadius: 'var(--radius)',
                padding: '20px 16px',
                cursor: detected ? 'pointer' : 'not-allowed',
                opacity: detected ? 1 : 0.4,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all .15s ease',
              }}
            >
              <div style={{ color: active ? 'var(--acc)' : 'var(--text-2)' }}>
                <Icon size={28} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: active ? 'var(--acc)' : 'var(--text)' }}>
                {t(`inst.${key}`)}
              </span>
              {!detected && (
                <span className="muted" style={{ fontSize: 11 }}>{t('sel.notDetected')}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            localStorage.setItem('cordeband_instrument', selected);
            router.push('/player');
          }}
        >
          {t('sel.enter')}
        </button>
        <span className="muted" style={{ fontSize: 14 }}>
          {SONG?.title ?? '—'} · {t(`inst.${selected}`)} {t('player.muted')}
        </span>
      </div>
    </div>
  );
}
