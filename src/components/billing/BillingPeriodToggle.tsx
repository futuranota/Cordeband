'use client';

import { useT } from '@/i18n/context';
import { ANNUAL_DISCOUNT_PERCENT, type BillingPeriod } from '@/lib/plans';

type BillingPeriodToggleProps = {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  className?: string;
  variant?: 'default' | 'compact';
};

export function BillingPeriodToggle({
  value,
  onChange,
  className,
  variant = 'default',
}: BillingPeriodToggleProps) {
  const { t } = useT();
  const offLabel = t('price.annualOff').replace('{pct}', String(ANNUAL_DISCOUNT_PERCENT));

  if (variant === 'compact') {
    return (
      <div
        className={`billing-toggle-compact${className ? ` ${className}` : ''}`}
        role="tablist"
        aria-label={t('price.billingToggle')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={value === 'monthly'}
          className={value === 'monthly' ? 'on' : ''}
          onClick={() => onChange('monthly')}
        >
          {t('price.billingMonthlyShort')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === 'annual'}
          className={value === 'annual' ? 'on' : ''}
          onClick={() => onChange('annual')}
        >
          {t('price.billingAnnualShort')}
          <span className="billing-off-mini">{offLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`billing-toggle-wrap${className ? ` ${className}` : ''}`}>
      <div className="billing-toggle" role="tablist" aria-label={t('price.billingToggle')}>
        <button
          type="button"
          role="tab"
          aria-selected={value === 'monthly'}
          className={value === 'monthly' ? 'on' : ''}
          onClick={() => onChange('monthly')}
        >
          {t('price.billingMonthly')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === 'annual'}
          className={value === 'annual' ? 'on' : ''}
          onClick={() => onChange('annual')}
        >
          {t('price.billingAnnual')}
          <span className="billing-off-pill">{offLabel}</span>
        </button>
      </div>
    </div>
  );
}
