'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import type { StudioMode } from '@/types/studio';
import { IconArrowL, IconNote } from './studio-icons';

interface Props {
  mode: StudioMode;
}

export function StudioHeader({ mode }: Props) {
  const { t } = useT();
  const homeHref = mode === 'demo' ? '/' : '/dashboard';

  return (
    <header className="studio-top">
      <div className="studio-top-inner">
        <Link href={homeHref} className="studio-logo" aria-label="Cordeband">
          <span className="logo-mark"><IconNote size={17} sw={1.7} /></span>
          <span className="logo-word">Cordeband</span>
          <span className="studio-seg">Studio</span>
        </Link>
        <div className="studio-top-right">
          {mode === 'demo' ? (
            <Button asChild size="sm">
              <Link href="/signup?plan=free">{t('studio.tryFree')}</Link>
            </Button>
          ) : (
            <Link href={homeHref} className="ghost-link">
              <IconArrowL size={14} /> {t('studio.backToApp')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
