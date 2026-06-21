'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { IconLogout, IconCheck } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { getPlanLabel, type PlanId } from '@/lib/plans';

type CancelMembershipPanelProps = {
  userId: string;
  plan: Exclude<PlanId, 'free'>;
};

export function CancelMembershipPanel({ userId, plan }: CancelMembershipPanelProps) {
  const { t, tList } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const planLabel = getPlanLabel(plan, t);

  async function confirmCancel() {
    setConfirming(true);
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ intended_plan: null })
      .eq('id', userId);
    setConfirming(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      router.refresh();
    }, 2200);
  }

  return (
    <div className="cancel-panel">
      <button type="button" className="cancel-trigger" onClick={() => setOpen((o) => !o)}>
        <IconLogout size={16} />
        {t('cancel.trigger')}
        <span className="cancel-chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="card cancel-body">
          {!done ? (
            <>
              <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 17 }}>{t('cancel.title')}</p>
              <p className="muted" style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55 }}>
                {t('cancel.sub').replace('{plan}', planLabel)}
              </p>
              <ul className="cancel-loss">
                {tList('cancel.loss').map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: 12.5, margin: '16px 0 0', lineHeight: 1.5 }}>
                {t('cancel.note')}
              </p>
              <div className="row gap-12" style={{ marginTop: 20, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  {t('cancel.keep')}
                </button>
                <LoadingButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  loading={confirming}
                  onClick={confirmCancel}
                >
                  {t('cancel.confirm')}
                </LoadingButton>
              </div>
            </>
          ) : (
            <div className="cancel-done">
              <IconCheck size={22} sw={2.2} />
              <p style={{ margin: '8px 0 0', fontWeight: 700 }}>{t('cancel.done')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
