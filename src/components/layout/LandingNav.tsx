'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { LangToggle } from '@/components/ui/LangToggle';
import { useT } from '@/i18n/context';

export function LandingNav() {
  const { t } = useT();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <a href="#how" className="nav-link">{t('nav.how')}</a>
          <a href="#pricing" className="nav-link">{t('nav.pricing')}</a>
          <a href="#instruments" className="nav-link">{t('nav.instruments')}</a>
          <a href="#band" className="nav-link">{t('nav.band')}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LangToggle />
          <Link href="/login" className="nav-link">{t('nav.login')}</Link>
          <Link href="/signup?plan=free" className="btn btn-primary btn-sm"
            style={{ backgroundColor: 'rgb(32,157,215)', color: '#fff' }}
          >
            {t('nav.start')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
