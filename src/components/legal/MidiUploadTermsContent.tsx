'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';

export function MidiUploadTermsContent() {
  const { t, tList } = useT();
  const bullets = tList('midiTerms.legalBullets');

  return (
    <div className="legal-page page">
      <div className="legal-page-inner card">
        <Link href="/dashboard" className="cb-link muted" style={{ fontSize: 13 }}>
          ← {t('common.back')}
        </Link>
        <h1 className="h1" style={{ marginTop: 20, fontSize: 'clamp(28px,4vw,38px)' }}>
          {t('midiTerms.legalTitle')}
        </h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{t('midiTerms.legalUpdated')}</p>
        <p className="lead" style={{ marginTop: 20, maxWidth: '65ch' }}>{t('midiTerms.legalIntro')}</p>
        <ul className="legal-bullets">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 24, lineHeight: 1.6 }}>
          {t('midiTerms.legalFooter')}
        </p>
      </div>
    </div>
  );
}
