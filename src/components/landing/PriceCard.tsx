'use client';

import { useT } from '@/i18n/context';
import Link from 'next/link';
import { IconCheck, IconCrown, IconSpark, IconBand } from '@/components/ui/icons';

type Tier = 'free' | 'pro' | 'banda';

export function PriceCard({ tier }: { tier: Tier }) {
  const { t, tList } = useT();

  const config: Record<Tier, {
    label: string;
    amount: string;
    per: boolean;
    featKey: string;
    forKey: string;
    ctaKey: string;
    btn: string;
  }> = {
    free: {
      label: t('common.free'),
      amount: '$0',
      per: false,
      featKey: 'price.freeFeat',
      forKey: 'price.forFree',
      ctaKey: 'price.ctaFree',
      btn: 'btn-ghost',
    },
    pro: {
      label: 'BASIC',
      amount: '$9.99',
      per: true,
      featKey: 'price.proFeat',
      forKey: 'price.forPro',
      ctaKey: 'price.ctaPro',
      btn: 'btn-primary',
    },
    banda: {
      label: t('common.banda'),
      amount: '$19.99',
      per: true,
      featKey: 'price.bandaFeat',
      forKey: 'price.forBanda',
      ctaKey: 'price.ctaBanda',
      btn: 'btn-white',
    },
  };

  const d = config[tier];
  const hot = tier === 'banda';
  const featArr = tList(d.featKey);

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
          <div className="row" style={{ alignItems: 'flex-end', gap: 6, marginTop: 10 }}>
            <span className="amount">{d.amount}</span>
            {d.per && (
              <span style={{ marginBottom: 8, color: 'var(--text-3)', fontSize: 14 }}>{t('common.perMonth')}</span>
            )}
          </div>
          <div className="price-for">{t(d.forKey)}</div>
        </div>
        {tier === 'pro' && (
          <span className="badge-pro" style={{ backgroundColor: 'rgb(255, 255, 255)', color: '#0a0a0a' }}>
            <IconCrown size={12} sw={1.8} /> BASIC
          </span>
        )}
        {tier === 'banda' && (
          <span className="badge-pro badge-band">
            <IconBand size={12} sw={1.8} /> Banda
          </span>
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
          href="/signup"
          className={`btn btn-block ${d.btn}`}
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
