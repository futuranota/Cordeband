'use client';

import { useT } from '@/i18n/context';
import { PriceCard } from './PriceCard';

export function PricingSection() {
  const { t } = useT();

  return (
    <section id="pricing" className="section wrap">
      <div className="section-head">
        <p className="eyebrow">{t('price.eyebrow')}</p>
        <h2 className="h2" style={{ marginTop: 14 }}>{t('price.title')}</h2>
      </div>
      <div className="price-grid">
        <PriceCard tier="free" />
        <PriceCard tier="pro" />
        <PriceCard tier="banda" />
      </div>
    </section>
  );
}
