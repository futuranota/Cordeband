'use client';

import Link from 'next/link';
import { useT } from '@/i18n/context';
import { getPlanLabel, type PlanId } from '@/lib/plans';
import type { StudioSong } from '@/types/studio';
import { IconNote, IconPlus } from './studio-icons';

interface Props {
  songs: StudioSong[];
  activeId: string | null;
  remaining: number;
  total: number;
  plan: PlanId;
  onOpen: (id: string) => void;
  onNew: () => void;
}

export function StudioSidebar({ songs, activeId, remaining, total, plan, onOpen, onNew }: Props) {
  const { t } = useT();
  const planName = getPlanLabel(plan, t);
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

  return (
    <aside className="studio-side">
      <div className="side-head">
        <span className="side-title">{t('studio.sideTitle')}</span>
        <button type="button" className="side-new" onClick={onNew} aria-label={t('studio.sideNew')}>
          <IconPlus size={16} sw={2} />
        </button>
      </div>
      <div className="side-list">
        {songs.length === 0 ? (
          <div className="side-empty">
            <span className="side-empty-ico"><IconNote size={20} /></span>
            <div className="side-empty-t">{t('studio.sideEmpty')}</div>
            <div className="side-empty-s">{t('studio.sideHint')}</div>
          </div>
        ) : (
          songs.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`song-item${s.id === activeId ? ' on' : ''}`}
              onClick={() => onOpen(s.id)}
            >
              <span className="song-item-glyph">{s.instrumental ? '♬' : '♪'}</span>
              <span className="song-item-body">
                <span className="song-item-title">{s.title || t('studio.untitled')}</span>
                <span className="song-item-meta">
                  {(s.genreName ? `${s.genreName} · ` : '')}{s.bpm} BPM
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      <div className="credit-bar">
        <div className="cb-top">
          <span className={`cb-plan${plan === 'free' ? ' free' : ''}`}>{planName}</span>
          <span className="cb-count">
            <b>{remaining}</b><span className="cb-slash">/{total}</span>
          </span>
        </div>
        <div className="cb-track">
          <i style={{ width: `${pct}%` }} className={remaining === 0 ? 'empty' : ''} />
        </div>
        {remaining === 0 ? (
          <Link href="/profile#plans" className="cb-foot cb-link">
            {t('studio.noCredits')} · {t('studio.seePricing')}
          </Link>
        ) : (
          <span className="cb-foot">
            {remaining} {remaining === 1 ? t('studio.credit1') : t('studio.credits')} {t('studio.creditBar')}
          </span>
        )}
      </div>
    </aside>
  );
}
