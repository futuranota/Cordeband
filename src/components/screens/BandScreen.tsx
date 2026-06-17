'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { INST_ORDER, INSTRUMENTS, LIBRARY } from '@/lib/data';
import { canUseBandPlayer } from '@/lib/plan-access';
import { normalizePlan } from '@/lib/supabase/profile';
import { IconBand } from '@/components/ui/icons';

const ROOM_CODE = 'BND-4X9';
const SONG = LIBRARY[0];

export function BandScreen() {
  const { t } = useT();
  const { profile } = useSession();
  const plan = normalizePlan(profile?.plan);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string>('guitar');

  const link = `cordeband.com/sala/${ROOM_CODE}`;

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!canUseBandPlayer(plan)) {
    return (
      <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 560 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <IconBand size={32} style={{ color: 'var(--acc)' }} />
          </div>
          <h1 className="h2" style={{ marginBottom: 8 }}>{t('room.createTitle')}</h1>
          <p className="muted" style={{ marginBottom: 24 }}>{t('room.bandOnly')}</p>
          <Link href="/profile" className="btn btn-primary">{t('room.getBanda')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <IconBand size={24} style={{ color: 'var(--acc)' }} />
        <div>
          <p className="eyebrow">{t('room.eyebrow')}</p>
          <h1 className="h2" style={{ marginTop: 4 }}>{t('room.createTitle')}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left — room info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Song */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('room.chooseSong')}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'var(--acc-soft)',
                border: '1px solid var(--acc-line)', display: 'grid', placeItems: 'center', fontSize: 18,
              }}>{SONG.glyph}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{SONG.title}</p>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{SONG.artist}</p>
              </div>
            </div>
          </div>

          {/* Room code */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('room.code')}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--acc)', margin: '0 0 14px', fontFamily: 'monospace' }}>
              {ROOM_CODE}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px' }}>{t('room.share')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={link} className="input" style={{ fontSize: 13 }} />
              <button onClick={copy} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                {copied ? t('room.copied') : t('room.copyLink')}
              </button>
            </div>
          </div>

          <p className="muted" style={{ fontSize: 13 }}>{t('room.syncNote')}</p>
        </div>

        {/* Right — instrument picker + roster */}
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('room.yourInst')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {INST_ORDER.map(key => {
              const { Icon } = INSTRUMENTS[key];
              const active = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  style={{
                    background: active ? 'var(--acc-soft)' : 'var(--elev-2)',
                    border: `1px solid ${active ? 'var(--acc-line)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: active ? 'var(--acc)' : 'var(--text-2)',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  <Icon size={16} />
                  {t(`inst.${key}`)}
                </button>
              );
            })}
          </div>

          <button className="btn btn-primary btn-block">{t('room.startAll')}</button>
          <p className="muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>{t('room.startHint')}</p>
        </div>
      </div>
    </div>
  );
}
