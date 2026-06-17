'use client';

import { useT } from '@/i18n/context';
import { getPlanPricing, type BillingPeriod, type PlanId } from '@/lib/plans';

type PlanPriceDisplayProps = {
  plan: Exclude<PlanId, 'free'>;
  period: BillingPeriod;
  /** Usa el estilo grande `.amount` de las tarjetas de precio del landing. */
  variant?: 'default' | 'price-card';
};

export function PlanPriceDisplay({ plan, period, variant = 'default' }: PlanPriceDisplayProps) {
  const { t } = useT();
  const pricing = getPlanPricing(plan, period);
  const isAnnual = period === 'annual';
  const inCard = variant === 'price-card';

  return (
    <div className={`plan-price-display${inCard ? ' in-price-card' : ''}`}>
      <div
        className={inCard ? 'row' : 'plan-price-row'}
        style={inCard ? { alignItems: 'flex-end', gap: 6, flexWrap: 'wrap' } : undefined}
      >
        {isAnnual && pricing.compareAmount && (
          <span className="plan-price-compare">{pricing.compareAmount}</span>
        )}
        <span className={inCard ? 'amount' : 'plan-price-amount'}>{pricing.displayAmount}</span>
        {inCard ? (
          <span style={{ marginBottom: 8, color: 'var(--text-3)', fontSize: 14 }}>
            {isAnnual ? t('common.perYear') : t('common.perMonth')}
          </span>
        ) : (
          <span className="plan-price-per">
            {isAnnual ? t('common.perYear') : t('common.perMonth')}
          </span>
        )}
      </div>

      {isAnnual && pricing.savingsAmount && (
        <span className="plan-price-save">
          {t('price.youSave').replace('{amount}', pricing.savingsAmount)}
        </span>
      )}

      {isAnnual && pricing.monthlyEquivalent && (
        <p className="plan-price-equiv muted">
          {t('price.billedAs').replace('{amount}', pricing.monthlyEquivalent)}
        </p>
      )}
    </div>
  );
}
