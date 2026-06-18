'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { normalizePlan } from '@/lib/supabase/profile';
import { IconClose, IconCrown, IconSpark } from '@/components/ui/icons';

const DISMISS_KEY = 'cordeband_plan_banner_dismissed';

type UpgradeBannerProps = {
  className?: string;
};

export function UpgradeBanner({ className }: UpgradeBannerProps) {
  const { t } = useT();
  const router = useRouter();
  const { profile } = useSession();
  const plan = normalizePlan(profile?.plan);

  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (plan !== 'free') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setVisible(true);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [plan]);

  if (!visible || plan !== 'free') return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  function goToPlans() {
    router.push('/profile#plans');
  }

  return (
    <div className={`upgrade-pill-wrap${className ? ` ${className}` : ''}`}>
      <div className={`upgrade-pill-shell${entered ? ' is-visible' : ''}`}>
        <span className="upgrade-pill-icon upgrade-pill-icon-a" aria-hidden>
          <IconCrown size={14} />
        </span>
        <span className="upgrade-pill-icon upgrade-pill-icon-b" aria-hidden>
          <IconSpark size={14} />
        </span>

        <div className="upgrade-pill">
          <button
            type="button"
            className="upgrade-pill-cta"
            onClick={goToPlans}
          >
            {t('upgrade.bannerCta')}
          </button>
          <span className="upgrade-pill-desc">{t('upgrade.bannerSub')}</span>
          <button
            type="button"
            className="upgrade-pill-close"
            onClick={dismiss}
            aria-label={t('upgrade.bannerDismiss')}
          >
            <IconClose size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
