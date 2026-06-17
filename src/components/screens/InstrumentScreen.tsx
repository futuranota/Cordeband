'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';
import { StagePanel } from '@/components/player/StagePanel';
import { IconArrow, IconArrowL, IconCheck } from '@/components/ui/icons';

const SONG = LIBRARY[0];

export function InstrumentScreen() {
  const { t } = useT();
  const router = useRouter();
  const available = new Set(SONG?.instruments ?? []);
  const [sel, setSel] = useState<InstrumentKey | null>(
    available.has('guitar') ? 'guitar' : null,
  );

  function chooseInstrument(key: InstrumentKey) {
    localStorage.setItem('cordeband_instrument', key);
    router.push('/player');
  }

  return (
    <main className="wrap app-main page" style={{ maxWidth: 900 }}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <IconArrowL size={15} /> {t('nav.library')}
      </Link>

      <div style={{ textAlign: 'center' }}>
        <span className="eyebrow">{SONG?.title ?? '—'}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>{t('sel.whatPlay')}</h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '44ch' }}>{t('sel.sub')}</p>
      </div>

      <div style={{ marginTop: 36 }}>
        <StagePanel
          instruments={SONG?.instruments ?? []}
          youKey={sel}
          title={t('sel.stageTitle')}
          sub={t('sel.stageSub')}
        />
      </div>

      <div className="inst-grid">
        {INST_ORDER.map((k) => {
          const { Icon } = INSTRUMENTS[k];
          const on = available.has(k);
          const isSel = sel === k;
          return (
            <button
              key={k}
              type="button"
              className={`inst-card${isSel ? ' sel' : ''}${on ? '' : ' off'}`}
              disabled={!on}
              onClick={() => on && setSel(k)}
            >
              {isSel && (
                <span className="inst-check"><IconCheck size={13} sw={2.4} /></span>
              )}
              <span className="inst-ico"><Icon size={34} sw={1.4} /></span>
              <span className="inst-name">{t(`inst.${k}`)}</span>
              <span className="inst-state">
                {on ? (k === 'guitar' ? t('sel.last') : t('common.available')) : t('sel.notDetected')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="row center" style={{ marginTop: 40 }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!sel}
          onClick={() => sel && chooseInstrument(sel)}
        >
          {t('sel.enter')} <IconArrow size={17} />
        </button>
      </div>
    </main>
  );
}
