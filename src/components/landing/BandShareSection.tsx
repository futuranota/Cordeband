'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { INSTRUMENTS, type InstrumentKey } from '@/lib/data';
import { IconArrow, IconCheck, IconLoop } from '@/components/ui/icons';
import Link from 'next/link';

const BAND_CYAN = 'rgb(204, 249, 255)';

const ROSTER: { key: InstrumentKey; nameKey: string; taken: boolean; ini: string; col: string }[] = [
  { key: 'guitar', nameKey: 'band.m1', taken: true, ini: 'M', col: '#1ed760' },
  { key: 'drums',  nameKey: 'band.m2', taken: true, ini: 'D', col: '#4d9fff' },
  { key: 'bass',   nameKey: 'band.m3', taken: true, ini: 'S', col: '#e0a92b' },
  { key: 'piano',  nameKey: 'band.you', taken: false, ini: 'T', col: '#ffffff' },
  { key: 'vocals', nameKey: '', taken: false, ini: '?', col: '#ffffff' },
];

export function BandShareSection() {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const fakeLink = 'cordeband.app/s/las-luces-de-enero';

  function copy() {
    navigator.clipboard.writeText(fakeLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <section id="band" className="section bandshare">
      <div className="wrap">
        <div className="bandshare-grid">
          <div>
            <p className="eyebrow" style={{ color: BAND_CYAN }}>{t('band.eyebrow')}</p>
            <h2 className="h2" style={{ marginTop: 14 }}>{t('band.title')}</h2>
            <p className="lead" style={{ marginTop: 18 }}>{t('band.sub')}</p>
            <div className="hero-cta" style={{ marginTop: 28 }}>
              <Link href="/signup" className="btn btn-primary btn-lg" style={{ backgroundColor: BAND_CYAN, color: '#0a0a0a' }}>
                {t('band.cta')} <IconArrow size={17} />
              </Link>
            </div>
            <div className="hero-trust" style={{ marginTop: 18 }}>
              <IconCheck size={15} sw={2} />
              {t('band.note')}
            </div>
          </div>

          <div className="share-card">
            <label className="field-label">{t('band.linkLabel')}</label>
            <div className="share-link">
              <IconLoop size={15} style={{ color: 'var(--acc)', flex: '0 0 auto' }} />
              <span className="url">{fakeLink}</span>
              <button type="button" onClick={copy} className="btn btn-primary btn-sm" style={{ backgroundColor: BAND_CYAN, color: '#0a0a0a', flexShrink: 0 }}>
                {copied ? t('band.copied') : t('band.copy')}
              </button>
            </div>

            <div className="share-roster">
              <div className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 2 }}>
                {t('band.rosterTitle')}
              </div>
              {ROSTER.map((r) => {
                const { Icon } = INSTRUMENTS[r.key];
                return (
                  <div key={r.key} className={`roster-row${r.taken ? ' taken' : ''}`}>
                    <span className="r-ico"><Icon size={17} sw={1.5} /></span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="r-name">{t(`inst.${r.key}`)}</div>
                      <div className="r-inst">{r.taken ? t(r.nameKey) : t('band.open')}</div>
                    </div>
                    {r.taken ? (
                      <span className="r-ava" style={{ background: r.col, color: '#0a0a0a', border: 'none' }}>{r.ini}</span>
                    ) : (
                      <span className="roster-tag open">{t('band.open')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
