'use client';

import { useT } from '@/i18n/context';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="footer">
      <div className="wrap">
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t('foot.tagline')}</p>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{t('foot.rights')}</p>
      </div>
    </footer>
  );
}
