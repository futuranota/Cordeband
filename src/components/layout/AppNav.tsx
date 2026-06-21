'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { LangToggle } from '@/components/ui/LangToggle';
import { MobileNavSheet } from './MobileNavSheet';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { readActiveSongId } from '@/lib/supabase/fetch-song';
import { IconPlus, IconCrown, IconLogout, IconReset } from '@/components/ui/icons';

import { getPlanLabel, type PlanId } from '@/lib/plans';

type User = { name: string; email: string };

export function AppNav({ user, plan, isAdmin = false }: { user: User; plan: PlanId; isAdmin?: boolean }) {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [acctOpen, setAcctOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAcctOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem('cordeband_state_v1');
    router.push('/');
    router.refresh();
  }

  const [practiceHref, setPracticeHref] = useState('/instrument');

  useEffect(() => {
    const activeSongId = readActiveSongId();
    setPracticeHref(
      activeSongId
        ? `/instrument?songId=${encodeURIComponent(activeSongId)}`
        : '/instrument',
    );
  }, []);

  const links = [
    { href: '/dashboard', label: t('nav.library') },
    { href: '/studio', label: t('nav.studio') },
    { href: practiceHref, label: t('nav.practice') },
    ...(plan === 'banda' ? [{ href: '/band', label: t('nav.band') }] : []),
    { href: '/upload', label: t('nav.add') },
    { href: '/profile', label: t('nav.subscription') },
  ];

  const mobileItems = links.map((l) => ({
    ...l,
    active: pathname === l.href,
  }));

  const ini = user.name?.[0]?.toUpperCase() ?? '?';

  const planLabel: Record<PlanId, string> = {
    free: t('nav.freePlan'),
    pro: getPlanLabel('pro', t),
    banda: getPlanLabel('banda', t),
  };

  const badgeLabel = isAdmin ? t('nav.adminBadge') : getPlanLabel(plan, t);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-brand-row">
          <MobileNavSheet title="Cordeband" items={mobileItems} />
          <Logo />
          <div className="nav-links">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${pathname === l.href ? ' nav-link-active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-actions">
          <LangToggle />
          <Link href="/upload" className="btn btn-primary btn-sm" style={{ gap: 6 }}>
            <IconPlus size={15} />
            <span className="nav-add-label">{t('nav.add')}</span>
          </Link>
          {(isAdmin || plan !== 'free') && (
            <span className="badge-pro">
              <IconCrown size={12} />
              {badgeLabel}
            </span>
          )}

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button type="button" className="avatar" onClick={() => setAcctOpen((o) => !o)}>{ini}</button>
            {acctOpen && (
              <div className="acct-menu">
                <div className="acct-head">
                  <div className="avatar" style={{ cursor: 'default' }}>{ini}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{user.name}</p>
                    <p className="muted" style={{ margin: 0, fontSize: 12 }}>{isAdmin ? t('nav.adminBadge') : planLabel[plan]}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Link href="/admin" className="acct-item" onClick={() => setAcctOpen(false)}>
                    {t('nav.adminPanel')}
                  </Link>
                )}
                <button type="button" className="acct-item" onClick={logout}>
                  <IconLogout size={16} />
                  {t('acct.logout')}
                </button>
                <button
                  type="button"
                  className="acct-item"
                  onClick={() => {
                    localStorage.removeItem('cordeband_state_v1');
                    window.location.reload();
                  }}
                >
                  <IconReset size={16} />
                  {t('acct.reset')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
