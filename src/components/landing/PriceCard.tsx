'use client';

import { useState } from 'react';
import { IconCheck } from '@/components/ui/icons';
import { useT } from '@/i18n/context';
import Link from 'next/link';

type Tier = 'free' | 'pro' | 'banda';

export function PriceCard({ tier }: { tier: Tier }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const prices: Record<Tier, string> = { free: '$0', pro: '$9', banda: '$15' };
  const ctaKeys: Record<Tier, string> = { free: 'price.ctaFree', pro: 'price.ctaPro', banda: 'price.ctaBanda' };
  const labelKeys: Record<Tier, string> = { free: 'price.forFree', pro: 'price.forPro', banda: 'price.forBanda' };
  const featKeys: Record<Tier, string> = { free: 'price.freeFeat', pro: 'price.proFeat', banda: 'price.bandaFeat' };

  const feats = t(featKeys[tier]);
  const featArr: string[] = Array.isArray(feats) ? feats as unknown as string[] : [];

  const isPro = tier === 'pro';

  return (
    <div className={`price${isPro ? ' pro' : ''}`}>
      {isPro && (
        <div className="badge-pro" style={{ alignSelf: 'flex-start' }}>
          {t('price.popular')}
        </div>
      )}
      <div>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 6px' }}>{t(labelKeys[tier])}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)' }}>{prices[tier]}</span>
          <span className="muted" style={{ fontSize: 14 }}>{t('common.perMonth')}</span>
        </div>
      </div>

      <Link href="/signup" className={`btn btn-block ${isPro ? 'btn-primary' : 'btn-ghost'}`}>
        {t(ctaKeys[tier])}
      </Link>

      <button className="price-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? t('price.hideFeats') : t('price.showFeats')}
      </button>

      {open && (
        <ul>
          {featArr.map((f, i) => (
            <li key={i}>
              <IconCheck size={14} style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 2 }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
