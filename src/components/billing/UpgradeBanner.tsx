'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { IconCrown, IconSpark, IconArrow } from '@/components/ui/icons';

export function UpgradeBanner() {
  const { t } = useT();

  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-glow" />
      <div className="upgrade-banner-inner">
        <div>
          <span className="upgrade-banner-badge">
            <IconSpark size={12} />
            {t('upgrade.bannerBadge')}
          </span>
          <p className="upgrade-banner-title">{t('upgrade.bannerTitle')}</p>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, maxWidth: '52ch' }}>
            {t('upgrade.bannerSub')}
          </p>
        </div>
        <Link href="/profile" className="btn btn-primary">
          <IconCrown size={15} />
          {t('upgrade.bannerCta')}
          <IconArrow size={14} />
        </Link>
      </div>
    </div>
  );
}
