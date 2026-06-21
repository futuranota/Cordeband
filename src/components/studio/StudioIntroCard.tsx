'use client';

import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import { IconEdit, IconLoop, IconNote, IconSpark } from './studio-icons';

interface Props {
  onStart: () => void;
}

export function StudioIntroCard({ onStart }: Props) {
  const { t } = useT();
  const bullets = [
    { ico: <IconEdit size={16} />, txt: t('studio.introB1') },
    { ico: <IconNote size={16} />, txt: t('studio.introB2') },
    { ico: <IconLoop size={16} />, txt: t('studio.introB3') },
  ];

  return (
    <div className="canvas-center">
      <div className="intro-card">
        <span className="intro-eyebrow">{t('studio.sectionLabel')}</span>
        <h1 className="intro-title">{t('studio.introTitle')}</h1>
        <p className="intro-lead">{t('studio.introLead')}</p>
        <div className="intro-bullets">
          {bullets.map((b, i) => (
            <div className="intro-bullet" key={i}>
              <span className="ib-ico">{b.ico}</span>
              <span>{b.txt}</span>
            </div>
          ))}
        </div>
        <Button type="button" size="lg" onClick={onStart}>
          <IconSpark size={16} /> {t('studio.introCta')}
        </Button>
      </div>
    </div>
  );
}
