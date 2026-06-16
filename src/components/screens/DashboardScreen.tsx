'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { LIBRARY, publishedFeatured, stemsExpired, stemsMsLeft, INSTRUMENTS, type Song } from '@/lib/data';
import { IconPlus, IconCrown } from '@/components/ui/icons';

function fmtStemsLeft(ms: number, t: (k: string) => string): string {
  if (ms <= 0) return t('dash.stemsExpired');
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${t('dash.stemsFor')} ${h} ${h === 1 ? t('dash.hour') : t('dash.hours')} ${t('dash.more')}`;
  return `${t('dash.stemsFor')} ${m} ${t('dash.minutes')} ${t('dash.more')}`;
}

function SongCard({ song, onOpen }: { song: Song; onOpen: () => void }) {
  const { t } = useT();
  const expired = stemsExpired(song);
  const msLeft = stemsMsLeft(song);

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0,
          background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
          display: 'grid', placeItems: 'center', fontSize: 22,
        }}>{song.glyph}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</p>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{song.artist}</p>
        </div>
      </div>

      {/* Instruments */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {song.instruments.map(k => {
          const { Icon } = INSTRUMENTS[k];
          return (
            <div key={k} className="pill" style={{ fontSize: 11, padding: '4px 8px' }}>
              <Icon size={11} /> {k}
            </div>
          );
        })}
      </div>

      {/* Stems status */}
      <div style={{ fontSize: 12, color: expired ? 'var(--text-3)' : msLeft < 6 * 3600000 ? '#f59e0b' : 'var(--text-3)' }}>
        {expired ? t('dash.stemsExpired') : fmtStemsLeft(msLeft, t)}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {!expired ? (
          <button className="btn btn-primary btn-sm" onClick={onOpen}>{t('dash.play')}</button>
        ) : (
          <Link href="/upload" className="btn btn-ghost btn-sm">{t('dash.reactivateShort')}</Link>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ song }: { song: Song }) {
  const { t } = useT();
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: 'var(--acc-soft)', border: '1px solid var(--acc-line)',
          display: 'grid', placeItems: 'center', fontSize: 18,
        }}>{song.glyph}</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{song.title}</p>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{song.artist}</p>
        </div>
        <span className="badge-pro" style={{ marginLeft: 'auto', fontSize: 9 }}>{t('dash.featBadge')}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
        <span>{song.bpm} BPM</span>
        <span>·</span>
        <span>{song.keySig}</span>
      </div>
      <Link href="/instrument" className="btn btn-ghost btn-sm btn-block">{t('dash.play')}</Link>
    </div>
  );
}

export function DashboardScreen() {
  const { t } = useT();
  const router = useRouter();
  const [featured, setFeatured] = useState<Song[]>([]);

  useEffect(() => { setFeatured(publishedFeatured()); }, []);

  function openSong() { router.push('/instrument'); }

  return (
    <div className="wrap page" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p className="eyebrow">{t('dash.eyebrow')}</p>
          <h1 className="h2" style={{ marginTop: 6 }}>{t('dash.title')}</h1>
        </div>
        <Link href="/upload" className="btn btn-primary" style={{ gap: 8, color: '#0a0a0a' }}>
          <IconPlus size={16} />
          {t('dash.add')}
        </Link>
      </div>

      {/* Personal library */}
      {LIBRARY.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('dash.emptyTitle')}</p>
          <p className="muted" style={{ marginBottom: 24 }}>{t('dash.emptySub')}</p>
          <Link href="/upload" className="btn btn-primary">{t('dash.uploadFirst')}</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 48 }}>
          {LIBRARY.map(s => <SongCard key={s.id} song={s} onOpen={openSong} />)}
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="h3">{t('dash.featTitle')}</h2>
              <IconCrown size={16} style={{ color: 'var(--acc)' }} />
            </div>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('dash.featSub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {featured.map(s => <FeaturedCard key={s.id} song={s} />)}
          </div>
        </section>
      )}

      {/* Bands section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 className="h3">{t('dash.bandsTitle')}</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{t('dash.bandsSub')}</p>
          </div>
          <Link href="/band" className="btn btn-ghost btn-sm">{t('dash.createRoom')}</Link>
        </div>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p className="muted">{t('dash.bandsEmpty')}</p>
          <Link href="/band" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
            {t('dash.joinRoom')}
          </Link>
        </div>
      </section>
    </div>
  );
}
