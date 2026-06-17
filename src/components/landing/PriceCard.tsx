'use client';

import { useT } from '@/i18n/context';
import Link from 'next/link';
import { IconCheck, IconSpark } from '@/components/ui/icons';
import { PlanPriceDisplay } from '@/components/billing/PlanPriceDisplay';
import { BillingPeriodToggle } from '@/components/billing/BillingPeriodToggle';
import { saveBillingPeriod, type BillingPeriod } from '@/lib/plans';

type Tier = 'free' | 'pro' | 'banda';

type PriceCardProps = {
  tier: Tier;
  billingPeriod: BillingPeriod;
  onBillingChange?: (period: BillingPeriod) => void;
};

export function PriceCard({ tier, billingPeriod, onBillingChange }: PriceCardProps) {
  const { t, tList } = useT();

  const config: Record<Tier, {
    label: string;
    featKey: string;
    forKey: string;
    ctaKey: string;
    btn: string;
  }> = {
    free: {
      label: t('common.free'),
      featKey: 'price.freeFeat',
      forKey: 'price.forFree',
      ctaKey: 'price.ctaFree',
      btn: 'btn-ghost',
    },
    pro: {
      label: t('common.pro'),
      featKey: 'price.proFeat',
      forKey: 'price.forPro',
      ctaKey: 'price.ctaPro',
      btn: 'btn-primary',
    },
    banda: {
      label: t('common.banda'),
      featKey: 'price.bandaFeat',
      forKey: 'price.forBanda',
      ctaKey: 'price.ctaBanda',
      btn: 'btn-white',
    },
  };

  const d = config[tier];
  const hot = tier === 'banda';
  const featArr = tList(d.featKey);
  const isPaid = tier !== 'free';
  const signupHref =
    tier === 'free'
      ? '/signup?plan=free'
      : `/signup?plan=${tier}&billing=${billingPeriod}`;

  function onCtaClick() {
    if (isPaid) saveBillingPeriod(billingPeriod);
  }

  return (
    <div className={`card price${hot ? ' pro' : ''}`} style={{ borderColor: 'rgba(69, 9, 9, 0.44)' }}>
      {hot && (
        <span className="price-pop">
          <IconSpark size={12} />
          {t('price.popular')}
        </span>
      )}

      <div className="row spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ color: 'rgb(255, 255, 255)' }}>{d.label}</div>
          <div style={{ marginTop: 10 }}>
            {tier === 'free' ? (
              <div className="row" style={{ alignItems: 'flex-end', gap: 6 }}>
                <span className="amount">$0</span>
              </div>
            ) : (
              <PlanPriceDisplay plan={tier} period={billingPeriod} variant="price-card" />
            )}
          </div>
          <div className="price-for">{t(d.forKey)}</div>
        </div>

        {isPaid && onBillingChange && (
          <div className="price-card-billing">
            <BillingPeriodToggle
              value={billingPeriod}
              onChange={onBillingChange}
              variant="compact"
            />
          </div>
        )}
      </div>

      {featArr.length > 0 && (
        <ul>
          {featArr.map((f, i) => (
            <li key={i}>
              <IconCheck size={16} sw={2} />
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="price-cta">
        <Link
          href={signupHref}
          className={`btn btn-block ${d.btn}`}
          onClick={onCtaClick}
          style={tier === 'banda' ? undefined : {
            borderWidth: 2,
            borderColor: 'rgba(131, 131, 131, 0)',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            color: 'rgb(255, 255, 255)',
          }}
        >
          {tier === 'pro' ? <span style={{ color: '#ffffff' }}>{t(d.ctaKey)}</span> : t(d.ctaKey)}
        </Link>
      </div>
    </div>
  );
}
