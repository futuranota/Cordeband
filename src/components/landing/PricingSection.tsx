'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { PriceCard } from './PriceCard';
import { saveBillingPeriod, type BillingPeriod } from '@/lib/plans';

export function PricingSection() {
  const { t } = useT();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  function onBillingChange(period: BillingPeriod) {
    setBillingPeriod(period);
    saveBillingPeriod(period);
  }

  return (
    <section id="pricing" className="section wrap pricing-section">
      <div className="section-head">
        <p className="eyebrow">{t('price.eyebrow')}</p>
        <h2 className="h2" style={{ marginTop: 14 }}>{t('price.title')}</h2>
      </div>

      <div className="price-grid">
        <PriceCard tier="free" billingPeriod={billingPeriod} />
        <PriceCard
          tier="pro"
          billingPeriod={billingPeriod}
          onBillingChange={onBillingChange}
        />
        <PriceCard
          tier="banda"
          billingPeriod={billingPeriod}
          onBillingChange={onBillingChange}
        />
      </div>
    </section>
  );
}
