'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { Button } from '@/components/ui/button';
import { IconCheck } from './studio-icons';

interface Props {
  text: string;
  label?: string;
  small?: boolean;
}

export function StudioCopyButton({ text, label, small }: Props) {
  const { t } = useT();
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <Button
      type="button"
      variant={done ? 'default' : 'outline'}
      size={small ? 'sm' : 'default'}
      onClick={() => void copy()}
    >
      <IconCheck size={small ? 13 : 14} sw={2.2} />
      {done ? t('studio.copied') : (label ?? t('studio.copy'))}
    </Button>
  );
}
