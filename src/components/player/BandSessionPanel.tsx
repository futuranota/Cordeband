'use client';

import { useT } from '@/i18n/context';
import { INSTRUMENTS, type InstrumentKey } from '@/lib/data';
import type { BandMember } from '@/lib/demo-band';
import { IconBand, IconPlay } from '@/components/ui/icons';

type BandSessionPanelProps = {
  members: BandMember[];
  activeInstruments: InstrumentKey[];
  leaderInstrument: InstrumentKey;
  playing: boolean;
};

export function BandSessionPanel({
  members,
  activeInstruments,
  leaderInstrument,
  playing,
}: BandSessionPanelProps) {
  const { t } = useT();
  const activeCount = members.filter((m) => m.active).length;
  const playingNow = members.filter((m) => m.playing && m.active);

  return (
    <div className="card band-session">
      <div className="band-session-head">
        <div className="row gap-8">
          <span className="dash-sec-icon"><IconBand size={16} /></span>
          <div className="band-session-head-text">
            <p className="band-session-title">{t('bandDemo.sessionTitle')}</p>
            <p className="band-session-sub">
              {t('bandDemo.activeCount').replace('{n}', String(activeCount))}
            </p>
          </div>
        </div>
        {playing && (
          <span className="band-live-pill">
            <span className="ping" />
            {t('bandDemo.live')}
          </span>
        )}
      </div>

      <div className="band-now-playing">
        <p className="band-section-label">{t('bandDemo.nowPlaying')}</p>
        {playingNow.length > 0 ? (
          <div className="band-now-list">
            {playingNow.map((m) => {
              const { Icon } = INSTRUMENTS[m.instrument];
              return (
                <div key={m.id} className="band-now-item">
                  <span className="band-now-ico"><Icon size={16} sw={1.5} /></span>
                  <div className="band-now-text">
                    <span className="band-now-name">
                      {m.name}
                      {m.isLeader && <span className="band-leader-tag">{t('room.leaderTag')}</span>}
                    </span>
                    <span className="band-now-inst">{t(`inst.${m.instrument}`)}</span>
                  </div>
                  <span className="eq mini"><i /><i /><i /></span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="band-now-empty muted">{t('bandDemo.waiting')}</p>
        )}
      </div>

      <div className="band-roster-section">
        <p className="band-section-label">{t('bandDemo.roster')}</p>
        <ul className="band-roster">
          {members.map((m) => {
            const { Icon } = INSTRUMENTS[m.instrument];
            const isPlaying = playing && activeInstruments.includes(m.instrument);
            const isLeader = m.instrument === leaderInstrument;
            return (
              <li
                key={m.id}
                className={`band-roster-item${!m.active ? ' offline' : ''}${isPlaying ? ' playing' : ''}${isLeader ? ' leader' : ''}`}
              >
                <span className={`band-avatar${m.active ? ' on' : ''}`}>
                  {m.name[0]?.toUpperCase()}
                  {m.active && <span className="band-online" />}
                </span>
                <div className="band-roster-body">
                  <div className="band-roster-top">
                    <span className="band-roster-name">
                      {m.name}
                      {m.isLeader && <span className="band-leader-tag">{t('room.leaderTag')}</span>}
                    </span>
                    <span className="band-roster-state">
                      {!m.active ? (
                        t('bandDemo.offline')
                      ) : isPlaying ? (
                        <><IconPlay size={11} /> {t('bandDemo.playing')}</>
                      ) : (
                        t('bandDemo.waiting')
                      )}
                    </span>
                  </div>
                  <span className="band-roster-inst">
                    <Icon size={12} sw={1.5} />
                    {t(`inst.${m.instrument}`)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="band-session-note muted">{t('bandDemo.adminNote')}</p>
    </div>
  );
}
