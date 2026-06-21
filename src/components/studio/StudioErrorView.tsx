'use client';

import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import { IconArrowL, IconClose } from './studio-icons';

interface Props {
  onBack: () => void;
}

export function StudioErrorView({ onBack }: Props) {
  const { t } = useT();

  return (
    <div className="canvas-center">
      <div className="studio-error">
        <span className="err-ico"><IconClose size={24} sw={2} /></span>
        <h2 className="h2" style={{ fontSize: 24 }}>{t('studio.errTitle')}</h2>
        <p className="lead" style={{ fontSize: 15, marginTop: 12 }}>{t('studio.errSub')}</p>
        <Button type="button" variant="outline" size="sm" style={{ marginTop: 24 }} onClick={onBack}>
          <IconArrowL size={15} /> {t('studio.errBack')}
        </Button>
      </div>
    </div>
  );
}
