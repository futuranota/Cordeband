'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/i18n/context';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="footer">
      <div className="wrap">
        <Link href="/" className="footer-logo" aria-label="Cordeband">
          <Image src="/assets/Corderband-logo.svg" alt="Cordeband" width={24} height={24} />
        </Link>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{t('foot.rights')}</p>
      </div>
    </footer>
  );
}
