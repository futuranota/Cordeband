'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconSpark, IconCheck, IconPause } from '@/components/ui/icons';

const DEMO_NOTES = [
  { x: 42, y: 64 }, { x: 74, y: 52 }, { x: 104, y: 40 }, { x: 138, y: 58 },
  { x: 176, y: 46 }, { x: 212, y: 64 }, { x: 250, y: 34 }, { x: 286, y: 52 }, { x: 322, y: 58 },
];

function DemoStaff() {
  return (
    <svg viewBox="0 0 360 150" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="14" x2="346" y1={40 + i * 15} y2={40 + i * 15} stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
      ))}
      <text x="20" y="74" fontFamily="Georgia, serif" fontSize="40" fill="#cfcfcf" opacity="0.85">𝄞</text>
      {DEMO_NOTES.map((n) => (
        <g key={n.x}>
          <ellipse cx={n.x} cy={n.y} rx="6.4" ry="4.8" fill="#cfcfcf" transform={`rotate(-18 ${n.x} ${n.y})`} />
          <line x1={n.x + 6} x2={n.x + 6} y1={n.y} y2={n.y - 26} stroke="#cfcfcf" strokeWidth="1.4" />
        </g>
      ))}
      <line x1="150" x2="150" y1="24" y2="126" stroke="rgb(142, 173, 210)" strokeWidth="2" />
      <circle cx="150" cy="24" r="4" fill="rgb(204, 249, 255)" />
    </svg>
  );
}

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
              <DemoStaff />
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
