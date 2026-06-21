'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconSpark, IconCheck, IconPause } from '@/components/ui/icons';
import { MusicalStaffDemo } from '@/components/landing/MusicalStaffDemo';

export function HeroSection() {
  const { t } = useT();

  return (
    <div className="hero-grid">
      <div>
        <span className="pill hero-eyebrow" style={{ fontWeight: 500, color: 'rgb(136, 136, 136)' }}>
          <IconSpark size={13} />
          {t('hero.badge')}
        </span>
        <h1 className="h1" style={{ color: 'rgb(255, 255, 255)' }}>
          {t('hero.t1')}
          <span className="ink-em" style={{ color: 'rgb(252, 252, 252)' }}>{t('hero.em')}</span>
          {t('hero.t2')}
        </h1>
        <p className="lead hero-sub" style={{ fontSize: 15 }}>{t('hero.sub')}</p>
        <div className="hero-cta">
          <Link href="/signup?plan=free" className="btn btn-lg btn-primary" style={{ backgroundColor: 'rgb(32, 157, 215)', color: 'rgb(255, 255, 255)' }}>
            {t('hero.ctaStart')} →
          </Link>
          <Link
            href="/player?demo=banda"
            className="btn btn-lg btn-ghost"
            onClick={() => localStorage.setItem('cordeband_instrument', 'guitar')}
          >
            {t('hero.ctaDemoBanda')}
          </Link>
          <Link
            href="/player"
            className="btn btn-lg btn-ghost"
            onClick={() => localStorage.setItem('cordeband_instrument', 'guitar')}
          >
            {t('hero.ctaDemo')}
          </Link>
        </div>
        <div className="hero-trust">
          <IconCheck size={15} sw={2} />
          {t('hero.trust')}
        </div>
      </div>

      <div className="hero-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-guitar" src="/assets/guitar-black.png" alt="Guitarra eléctrica negra" />

        <div className="hero-demo-float">
          <div className="card demo-card">
            <div className="row spread" style={{ marginBottom: 14, alignItems: 'flex-start', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div className="acc-text" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 700, color: 'rgb(161, 161, 161)' }}>
                  {t('hero.nowPlaying')}
                </div>
                <div className="serif" style={{ fontSize: 18, fontWeight: 700, marginTop: 5, lineHeight: 1.15, color: '#fff' }}>
                  {t('hero.demoSong')}
                </div>
              </div>
              <span className="muted-tag" style={{ flex: '0 0 auto', color: 'rgb(255, 255, 255)' }}>
                <span className="dot" />
                {t('hero.demoTag')}
              </span>
            </div>

            <div className="demo-staff">
              <MusicalStaffDemo showCursor />
            </div>

            <div className="demo-bar">
              <span className="play-btn" style={{ width: 42, height: 42, backgroundColor: 'rgb(32, 157, 215)' }}>
                <IconPause size={16} />
              </span>
              <div className="demo-progress">
                <i />
              </div>
              <span className="muted tnum" style={{ fontSize: 12 }}>1:34</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
