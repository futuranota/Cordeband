'use client';

import { useT } from '@/i18n/context';
import { IconUpload, IconNote, InstGuitar } from '@/components/ui/icons';
import type { ComponentType, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

function StepCard({ n, title, body, Icon }: { n: string; title: string; body: string; Icon: ComponentType<IconProps> }) {
  return (
    <div className="card step">
      <div className="row spread">
        <div className="step-n">{n}</div>
        <span style={{ color: 'var(--acc)' }}><Icon size={22} /></span>
      </div>
      <h3 className="h3">{title}</h3>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>{body}</p>
    </div>
  );
}

export function HowSection() {
  const { t } = useT();

  return (
    <section id="how" className="section wrap">
      <div className="section-head">
        <p className="eyebrow">{t('how.eyebrow')}</p>
        <h2 className="h2" style={{ marginTop: 14 }}>{t('how.title')}</h2>
      </div>
      <div className="steps">
        <StepCard n="1" Icon={IconUpload} title={t('how.s1t')} body={t('how.s1b')} />
        <StepCard n="2" Icon={InstGuitar} title={t('how.s2t')} body={t('how.s2b')} />
        <StepCard n="3" Icon={IconNote} title={t('how.s3t')} body={t('how.s3b')} />
      </div>
    </section>
  );
}
