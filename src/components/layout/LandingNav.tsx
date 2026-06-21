'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { LangToggle } from '@/components/ui/LangToggle';
import { MobileNavSheet } from './MobileNavSheet';
import { useT } from '@/i18n/context';

export function LandingNav() {
  const { t } = useT();

  const mobileItems = [
    { href: '#how', label: t('nav.how') },
    { href: '/studio', label: t('nav.studio') },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '#instruments', label: t('nav.instruments') },
    { href: '#band', label: t('nav.band') },
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-brand-row">
          <MobileNavSheet
            title="Cordeband"
            items={mobileItems}
            footer={(
              <>
                <Link href="/login" className="nav-mobile-link">
                  {t('nav.login')}
                </Link>
                <Link
                  href="/signup?plan=free"
                  className="btn btn-primary btn-block"
                  style={{ backgroundColor: 'rgb(32,157,215)', color: '#fff' }}
                >
                  {t('nav.start')}
                </Link>
              </>
            )}
          />
          <Logo />
        </div>
        <div className="nav-links">
          <a href="#how" className="nav-link">{t('nav.how')}</a>
          <Link href="/studio" className="nav-link">{t('nav.studio')}</Link>
          <a href="#pricing" className="nav-link">{t('nav.pricing')}</a>
          <a href="#instruments" className="nav-link">{t('nav.instruments')}</a>
          <a href="#band" className="nav-link">{t('nav.band')}</a>
        </div>
        <div className="nav-actions">
          <LangToggle />
          <Link href="/login" className="nav-link nav-login-desktop">{t('nav.login')}</Link>
          <Link
            href="/signup?plan=free"
            className="btn btn-primary btn-sm nav-cta-desktop"
            style={{ backgroundColor: 'rgb(32,157,215)', color: '#fff' }}
          >
            {t('nav.start')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
