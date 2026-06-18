'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import {
  stemsExpired, stemsMsLeft,
  INSTRUMENTS, type Song, type InstrumentKey,
} from '@/lib/data';
import { fetchPublishedCatalogSongs } from '@/lib/supabase/fetch-published-catalog';
import { fetchUserLibrarySongs } from '@/lib/supabase/fetch-user-library';
import { includedSongQuota } from '@/lib/plans';
import { normalizePlan } from '@/lib/supabase/profile';
import {
  IconPlus, IconCrown, IconBand, IconUpload, IconCheck,
  IconClock, IconNote, IconSpark, IconPlay,
} from '@/components/ui/icons';

function useStemsTick() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
}

function StemsStatus({ song, compact }: { song: Song; compact?: boolean }) {
  const { t } = useT();
  useStemsTick();
  const ms = stemsMsLeft(song);
  if (ms <= 0) {
    return (
      <span className="stems-pill expired">
        <IconClock size={12} /> {t('dash.stemsExpired')}
      </span>
    );
  }
  const hours = ms / 3600000;
  let value: string;
  if (hours >= 1) {
    const h = Math.floor(hours);
    value = `${h} ${h === 1 ? t('dash.hour') : t('dash.hours')}`;
  } else {
    value = `${Math.max(1, Math.round(hours * 60))} ${t('dash.minutes')}`;
  }
  const low = hours < 6;
  if (compact) return <span className={`stems-pill${low ? ' low' : ''}`}><IconClock size={12} /> {value}</span>;
  return (
    <span className={`stems-pill${low ? ' low' : ''}`}>
      <IconClock size={12} /> {t('dash.stemsFor')} {value} {t('dash.more')}
    </span>
  );
}

function SongCard({ song, onOpen }: { song: Song; onOpen: (song: Song) => void }) {
  const { t } = useT();
  useStemsTick();
  const expired = stemsExpired(song);

  return (
    <div className={`card song-card${expired ? ' expired' : ''}`} onClick={() => onOpen(song)}>
      <div className="song-cover">
        <span className="cover-glyph">{song.glyph}</span>
        {expired ? (
          <span className="cover-tag warn"><IconUpload size={11} /> {t('dash.stemsExpired')}</span>
        ) : (
          <span className="cover-tag">{t('dash.eyebrow')}</span>
        )}
        {expired && (
          <div className="cover-regen">
            <span className="regen-ico"><IconUpload size={18} /></span>
          </div>
        )}
      </div>
      <div className="song-body">
        <div>
          <div className="song-title">{song.title}</div>
          <div className="song-artist">{song.artist}</div>
        </div>
        <div className="song-insts">
          {song.instruments.slice(0, 4).map((k) => {
            const { Icon } = INSTRUMENTS[k];
            return (
              <span key={k} className="pill" style={{ padding: '4px 9px', fontSize: 11 }}>
                <Icon size={12} sw={1.5} /> {t(`inst.${k}`)}
              </span>
            );
          })}
        </div>
        <div className="song-foot">
          <StemsStatus song={song} />
          {expired && (
            <button type="button" className="btn btn-primary btn-sm song-cta" onClick={(e) => { e.stopPropagation(); onOpen(song); }}>
              <IconUpload size={14} /> {t('dash.reactivateShort')}
            </button>
          )}
        </div>
        <div className="song-scoresafe"><IconCheck size={12} sw={2.2} /> {t('dash.scoreSafe')}</div>
      </div>
    </div>
  );
}

function EmptyLibrary() {
  const { t } = useT();
  return (
    <div className="empty page">
      <div className="empty-art"><IconNote size={40} sw={1.4} /></div>
      <h1 className="h1" style={{ fontSize: 'clamp(30px,4vw,42px)' }}>{t('dash.emptyTitle')}</h1>
      <p className="lead" style={{ margin: '18px auto 0', maxWidth: '46ch' }}>{t('dash.emptySub')}</p>
      <div className="row center gap-12" style={{ marginTop: 30 }}>
        <Link href="/upload" className="btn btn-primary btn-lg">
          <IconPlus size={16} /> {t('dash.uploadFirst')}
        </Link>
      </div>
      <div className="row center gap-24" style={{ marginTop: 34, color: 'var(--text-4)', fontSize: 13 }}>
        <span className="row gap-8"><IconUpload size={15} /> {t('dash.formats')}</span>
        <span className="row gap-8"><IconClock size={15} /> {t('dash.readyIn')}</span>
      </div>
    </div>
  );
}

function FeaturedSongCard({ song, onOpen }: { song: Song; onOpen: () => void }) {
  const { t } = useT();
  return (
    <div className="card feat-card" onClick={onOpen}>
      <div className="feat-cover">
        <span className="feat-badge"><IconSpark size={11} /> {t('dash.featBadge')}</span>
        {song.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={song.coverUrl} alt="" className="feat-cover-img" />
        ) : (
          <span className="feat-glyph">{song.glyph}</span>
        )}
        {song.isAiGenerated && (
          <span className="feat-ai-badge">{t('dash.aiGenerated')}</span>
        )}
        <span className="feat-play"><IconPlay size={16} /></span>
      </div>
      <div className="feat-body">
        <div className="feat-title">{song.title}</div>
        <div className="feat-artist">{song.artist}</div>
        <div className="feat-meta">
          <span>{song.bpm} BPM</span>
          <span>·</span>
          <span>{song.keySig}</span>
          <span className="feat-insts">
            {song.instruments.slice(0, 3).map((k) => {
              const { Icon } = INSTRUMENTS[k];
              return <Icon key={k} size={12} sw={1.5} />;
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturedSection({ items, onOpen }: { items: Song[]; onOpen: (song: Song) => void }) {
  const { t } = useT();
  return (
    <section className="dash-section">
      <div className="dash-sec-head">
        <div>
          <div className="row gap-8">
            <span className="dash-sec-icon"><IconSpark size={16} /></span>
            <div className="dash-sec-title">{t('dash.featTitle')}</div>
          </div>
          <div className="dash-sec-sub">{t('dash.featSub')}</div>
        </div>
      </div>
      <div className="feat-grid">
        {items.map((s) => (
          <FeaturedSongCard key={s.id} song={s} onOpen={() => onOpen(s)} />
        ))}
      </div>
    </section>
  );
}

function BandsSection({ isBanda }: { isBanda: boolean }) {
  const { t } = useT();

  const demoMembers = [
    { name: t('band.m1'), inst: 'vocals' as const, active: true },
    { name: t('band.m2'), inst: 'drums' as const, active: true },
    { name: t('band.m3'), inst: 'bass' as const, active: true },
    { name: t('band.you'), inst: 'guitar' as const, active: true, leader: true },
  ];

  return (
    <section className="dash-section">
      <div className="dash-sec-head">
        <div>
          <div className="row gap-8">
            <span className="dash-sec-icon"><IconBand size={16} /></span>
            <div className="dash-sec-title">{t('dash.bandsTitle')}</div>
          </div>
          <div className="dash-sec-sub">{t('dash.bandsSub')}</div>
        </div>
        {isBanda && (
          <Link href="/band" className="btn btn-ghost btn-sm">{t('dash.createRoom')}</Link>
        )}
      </div>

      {isBanda ? (
        <div className="card band-room">
          <div className="band-room-glyph"><IconBand size={22} /></div>
          <div className="band-room-info">
            <div className="band-room-name">{t('dash.bandRoomName')}</div>
            <div className="band-room-meta">
              <span>{demoMembers.length} {t('dash.roomMembers')}</span>
              <span>·</span>
              <span className="band-room-state playing">
                <span className="ping" />
                {t('dash.roomPlaying')}
              </span>
            </div>
            <div className="band-dash-roster">
              {demoMembers.map((m) => {
                const { Icon } = INSTRUMENTS[m.inst];
                return (
                  <span key={m.name} className={`band-dash-chip${m.leader ? ' leader' : ''}`}>
                    <span className="band-dash-avatar">{m.name[0]}</span>
                    <Icon size={12} sw={1.5} />
                    {m.name}
                    {m.leader && <span className="band-leader-tag">{t('room.leaderTag')}</span>}
                  </span>
                );
              })}
            </div>
          </div>
          <Link href="/player" className="btn btn-primary btn-sm">{t('dash.openRoom')}</Link>
        </div>
      ) : (
        <div className="card bands-empty">
          <span className="empty-ico"><IconBand size={20} /></span>
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t('room.bandOnly')}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{t('dash.bandUpgradeSub')}</div>
          </div>
          <Link href="/profile" className="btn btn-primary btn-sm">{t('dash.bandUpgradeCta')}</Link>
        </div>
      )}
    </section>
  );
}

export function DashboardScreen() {
  const { t } = useT();
  const router = useRouter();
  const { profile } = useSession();
  const [library, setLibrary] = useState<Song[]>([]);
  const [featured, setFeatured] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const plan = normalizePlan(profile?.plan);
  const planLimit = includedSongQuota(plan);
  const used = library.length;
  const left = Math.max(0, planLimit - used);
  const pct = planLimit > 0 ? Math.min(100, (used / planLimit) * 100) : 0;
  const isBanda = plan === 'banda';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchUserLibrarySongs(), fetchPublishedCatalogSongs()])
      .then(([userSongs, catalogSongs]) => {
        if (cancelled) return;
        setLibrary(userSongs);
        setFeatured(catalogSongs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function openSong(song?: Song) {
    if (song?.id) {
      router.push(`/instrument?songId=${encodeURIComponent(song.id)}`);
      return;
    }
    router.push('/instrument');
  }

  if (!loading && library.length === 0 && featured.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <main className="wrap app-main page">
      <div className="page-head">
        <div>
          <span className="eyebrow">{t('dash.eyebrow')}</span>
          <h1 className="h1">{t('dash.title')}</h1>
        </div>
        <div className="col gap-12" style={{ alignItems: 'flex-end' }}>
          <div className="plan-meter">
            {plan !== 'free' && (
              <span className="pill" style={{ marginBottom: 8, alignSelf: 'flex-end' }}>
                <IconCrown size={13} />
                {plan === 'banda' ? t('dash.poolBanda') : t('dash.unlimited')}
              </span>
            )}
            <span className="muted tnum" style={{ fontSize: 13 }}>
              {used} {t('dash.of')} {planLimit} {t('dash.included')}
            </span>
            <div className="meter"><i style={{ width: `${pct}%` }} /></div>
          </div>
          {plan !== 'free' && (
            <Link href="/upload" className="btn btn-primary btn-sm">
              <IconPlus size={15} /> {t('dash.add')}
            </Link>
          )}
        </div>
      </div>

      {library.length > 0 ? (
        <div className="song-grid">
          {library.map((s) => (
            <SongCard key={s.id} song={s} onOpen={openSong} />
          ))}
          <Link href="/upload" className="card add-card song-card">
            <div className="plus"><IconPlus size={22} /></div>
            <div style={{ fontWeight: 600 }}>{t('dash.add')}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {`${left} ${left === 1 ? t('dash.slotsLeft') : t('dash.slotsLeft2')}`}
            </div>
          </Link>
        </div>
      ) : (
        <div className="card bands-empty" style={{ padding: 24 }}>
          <span className="empty-ico"><IconUpload size={20} /></span>
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t('dash.emptyTitle')}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{t('dash.emptySub')}</div>
          </div>
          <Link href="/upload" className="btn btn-primary"><IconPlus size={15} /> {t('dash.uploadFirst')}</Link>
        </div>
      )}

      <BandsSection isBanda={isBanda} />

      {featured.length > 0 && (
        <FeaturedSection items={featured} onOpen={openSong} />
      )}
    </main>
  );
}
