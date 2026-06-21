'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { ADDON_SONG_PRICE } from '@/lib/plans';
import { IconPlus, IconCheck } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';

type AddonSongCardProps = {
  used: number;
  total: number;
};

export function AddonSongCard({ used, total }: AddonSongCardProps) {
  const { t } = useT();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);
  const atLimit = used >= total;

  function buy() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast(true);
      setTimeout(() => setToast(false), 2800);
    }, 600);
  }

  return (
    <div className="card addon-card">
      <div className="row spread" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>{t('addon.eyebrow')}</p>
          <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 18 }}>{t('addon.title')}</p>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, maxWidth: '42ch' }}>
            {atLimit ? t('addon.atLimit') : t('addon.sub')}
          </p>
        </div>
        <div className="addon-price-tag">
          <span className="addon-price">{ADDON_SONG_PRICE}</span>
          <span className="muted" style={{ fontSize: 12 }}>{t('addon.perSong')}</span>
        </div>
      </div>

      <div className="addon-row">
        <div className="addon-qty">
          <button type="button" className="iconbtn" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>−</button>
          <span className="tnum" style={{ fontWeight: 700, fontSize: 16, minWidth: 28, textAlign: 'center' }}>{qty}</span>
          <button type="button" className="iconbtn" onClick={() => setQty((q) => q + 1)}>+</button>
          <span className="muted" style={{ fontSize: 13 }}>{qty === 1 ? t('addon.song') : t('addon.songs')}</span>
        </div>
        <LoadingButton type="button" variant="default" loading={loading} onClick={buy}>
          <IconPlus size={15} />
          {t('addon.cta')} · {ADDON_SONG_PRICE}
          {qty > 1 ? ` × ${qty}` : ''}
        </LoadingButton>
      </div>

      {toast && (
        <p className="addon-toast">
          <IconCheck size={14} sw={2.2} />
          {t('addon.pending')}
        </p>
      )}
    </div>
  );
}
