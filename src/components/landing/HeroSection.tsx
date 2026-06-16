'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconSpark } from '@/components/ui/icons';

export function HeroSection() {
  const { t } = useT();

  return (
    <div className="hero-grid">
      <div>
        <div className="pill pill-ink" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>
          <IconSpark size={13} />
          <span>{t('hero.badge')}</span>
        </div>
        <h1 className="h1" style={{ marginTop: 18 }}>
          {t('hero.t1')}
          <em className="ink-em">{t('hero.em')}</em>
          {t('hero.t2')}
        </h1>
        <p className="lead" style={{ marginTop: 22, maxWidth: '34ch' }}>{t('hero.sub')}</p>
        <div className="hero-cta">
          <Link
            href="/signup"
            className="btn btn-lg btn-primary"
            style={{ backgroundColor: 'rgb(32,157,215)', color: '#fff' }}
          >
            {t('hero.ctaStart')}
          </Link>
          <button className="btn btn-lg btn-ghost">{t('hero.ctaDemo')}</button>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>{t('hero.trust')}</p>
      </div>

      {/* Demo card */}
      <div className="card" style={{ padding: 24, maxWidth: 380 }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>{t('hero.nowPlaying')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10,
            background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
            display: 'grid', placeItems: 'center', fontSize: 24,
          }}>♪</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>{t('hero.demoSong')}</p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{t('hero.demoTag')}</p>
          </div>
        </div>
        {/* Fake waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 20, height: 40 }}>
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${20 + Math.sin(i * 0.7) * 16 + Math.random() * 8}px`,
                background: i < 14 ? 'var(--acc)' : 'var(--elev-3)',
                borderRadius: 2,
                transition: 'height .1s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
