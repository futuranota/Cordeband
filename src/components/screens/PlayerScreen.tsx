'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { STEMS, LIBRARY, INSTRUMENTS, type InstrumentKey } from '@/lib/data';
import { IconPlay, IconPause, IconArrowL, IconLoop, IconGauge, IconVolume, IconMute } from '@/components/ui/icons';

const SONG = LIBRARY[0];

export function PlayerScreen() {
  const { t } = useT();
  const [playing, setPlaying] = useState(false);
  const [volumes, setVolumes] = useState<Record<string, number>>(
    Object.fromEntries(STEMS.map(s => [s.key, s.def]))
  );
  const [tab, setTab] = useState<'staff' | 'tab'>('staff');
  const instrument = (typeof window !== 'undefined'
    ? localStorage.getItem('cordeband_instrument') as InstrumentKey | null
    : null) ?? 'guitar';
  const { Icon: InstIcon } = INSTRUMENTS[instrument] ?? INSTRUMENTS.guitar;

  function setVol(key: string, v: number) {
    setVolumes(prev => ({ ...prev, [key]: v }));
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 68px)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--elev)', borderBottom: '1px solid var(--line)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/instrument" className="iconbtn">
          <IconArrowL size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{SONG.title}</p>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{SONG.artist}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--acc)' }}>
          <InstIcon size={18} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t(`inst.${instrument}`)} {t('player.muted')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Score area */}
        <div style={{ flex: 1, padding: 32 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['staff', 'tab'] as const).map(v => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`btn btn-sm ${tab === v ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t(`player.${v}`)}
              </button>
            ))}
          </div>

          {/* Fake score */}
          <div className="card" style={{ padding: 32, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: 'var(--text-3)', marginBottom: 12 }}>𝄞</div>
              <p className="muted" style={{ fontSize: 14 }}>
                {tab === 'staff' ? t('player.staff') : t('player.tab')} · {SONG.title}
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {SONG.bpm} BPM · {SONG.keySig}
              </p>
            </div>
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28, alignItems: 'center' }}>
            <button className="iconbtn"><IconLoop size={18} /></button>
            <button
              onClick={() => setPlaying(p => !p)}
              style={{
                width: 56, height: 56, borderRadius: 999,
                background: 'var(--acc)', color: 'var(--acc-ink)',
                border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                transition: 'transform .15s ease',
              }}
            >
              {playing ? <IconPause size={22} /> : <IconPlay size={22} />}
            </button>
            <button className="iconbtn"><IconGauge size={18} /></button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>0:00</span>
            <div style={{ flex: 1, height: 4, background: 'var(--elev-3)', borderRadius: 2 }}>
              <div style={{ width: '28%', height: '100%', background: 'var(--acc)', borderRadius: 2 }} />
            </div>
            <span className="muted" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>3:42</span>
          </div>
        </div>

        {/* Mixer sidebar */}
        <div style={{ width: 240, borderLeft: '1px solid var(--line)', padding: 24, background: 'var(--elev)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{t('player.mixT')}</p>
          <p className="muted" style={{ fontSize: 12, margin: '0 0 20px' }}>{t('player.mixSub')}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {STEMS.map(s => {
              const isMuted = s.key === instrument;
              const vol = volumes[s.key];
              const { Icon } = INSTRUMENTS[s.key];
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ color: isMuted ? 'var(--text-4)' : 'var(--acc)' }}>
                      {isMuted ? <IconMute size={14} /> : <IconVolume size={14} />}
                    </div>
                    <div style={{ color: isMuted ? 'var(--text-3)' : 'var(--text-2)' }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isMuted ? 'var(--text-3)' : 'var(--text-2)' }}>
                      {t(`inst.${s.key}`)}
                    </span>
                    {isMuted && <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{t('player.muted')}</span>}
                  </div>
                  <input
                    type="range" min={0} max={100} value={isMuted ? 0 : vol}
                    disabled={isMuted}
                    onChange={e => setVol(s.key, +e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--acc)', opacity: isMuted ? 0.3 : 1 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
