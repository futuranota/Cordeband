'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { PLAN_PRICE, type PlanId } from '@/lib/plans';
import { IconCrown, IconBand, IconCheck, IconSpark } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';

type UpgradePlanCardsProps = {
  userId: string;
  selected?: PlanId | null;
  onSelect?: (plan: Exclude<PlanId, 'free'>) => void;
};

export function UpgradePlanCards({ userId, selected, onSelect }: UpgradePlanCardsProps) {
  const { t, tList } = useT();
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);

  async function pick(plan: Exclude<PlanId, 'free'>) {
    onSelect?.(plan);
    setLoading(plan);
    const supabase = createClient();
    await supabase.from('profiles').update({ intended_plan: plan }).eq('id', userId);
    setLoading(null);
    router.refresh();
  }

  const cards: {
    plan: Exclude<PlanId, 'free'>;
    icon: typeof IconCrown;
    price: string;
    title: string;
    sub: string;
    feats: readonly string[];
    popular?: boolean;
  }[] = [
    {
      plan: 'pro',
      icon: IconCrown,
      price: PLAN_PRICE.pro,
      title: t('upgrade.proTitle'),
      sub: t('upgrade.proSub'),
      feats: tList('upgrade.proFeats'),
      popular: true,
    },
    {
      plan: 'banda',
      icon: IconBand,
      price: PLAN_PRICE.banda,
      title: t('upgrade.bandaTitle'),
      sub: t('upgrade.bandaSub'),
      feats: tList('upgrade.bandaFeats'),
    },
  ];

  return (
    <div className="upgrade-grid">
      {cards.map(({ plan, icon: Icon, price, title, sub, feats, popular }) => {
        const isSelected = selected === plan;
        const isLoading = loading === plan;
        return (
          <div
            key={plan}
            className={`upgrade-card${popular ? ' popular' : ''}${isSelected ? ' selected' : ''}`}
          >
            {popular && (
              <span className="upgrade-pop">
                <IconSpark size={11} />
                {t('price.popular')}
              </span>
            )}
            <div className="upgrade-card-head">
              <span className="upgrade-icon">
                <Icon size={22} />
              </span>
              <div>
                <p className="upgrade-plan-name">{title}</p>
                <p className="upgrade-price">
                  {price}
                  <span className="upgrade-per">{t('common.perMonth')}</span>
                </p>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>{sub}</p>
            <ul className="upgrade-feats">
              {feats.map((f) => (
                <li key={f}>
                  <IconCheck size={14} sw={2.2} />
                  {f}
                </li>
              ))}
            </ul>
            <LoadingButton
              type="button"
              className={`btn btn-block${popular ? ' btn-primary' : ' btn-ghost'}`}
              loading={isLoading}
              onClick={() => pick(plan)}
            >
              {isSelected ? t('upgrade.selected') : t(`upgrade.cta${plan === 'pro' ? 'Pro' : 'Banda'}`)}
            </LoadingButton>
          </div>
        );
      })}
    </div>
  );
}
