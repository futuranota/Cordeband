'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { createClient } from '@/lib/supabase/client';
import { INST_ORDER, INSTRUMENTS, type InstrumentKey, type Song } from '@/lib/data';
import { bandJoinUrl, memberDisplayName } from '@/lib/band-room';
import { canUseBandPlayer } from '@/lib/plan-access';
import { normalizePlan } from '@/lib/supabase/profile';
import { fetchBandEligibleSongs, pickDefaultBandSongId } from '@/lib/supabase/fetch-band-songs';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';
import { IconBand } from '@/components/ui/icons';
import { ClassicLoader } from '@/components/ui/ClassicLoader';

export function BandScreen() {
  const { t } = useT();
  const { user, profile } = useSession();
  const plan = normalizePlan(profile?.plan);
  const [copied, setCopied] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentKey>('guitar');
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [room, setRoom] = useState<BandRoomRecord | null>(null);
  const [members, setMembers] = useState<BandMemberRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSong = songs.find((s) => s.id === selectedSongId) ?? null;

  useEffect(() => {
    let cancelled = false;
    setSongsLoading(true);
    void fetchBandEligibleSongs()
      .then((eligible) => {
        if (cancelled) return;
        setSongs(eligible);
        setSelectedSongId(pickDefaultBandSongId(eligible));
      })
      .finally(() => {
        if (!cancelled) setSongsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const createOrLoadRoom = useCallback(async (inst: InstrumentKey, songId: string | null) => {
    if (!user || !songId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/band-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument: inst, songId }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Could not create room');
      }
      const session = await res.json() as { room: BandRoomRecord; members: BandMemberRecord[] };
      setRoom(session.room);
      setMembers(session.members);
      if (session.room.song_id) {
        setSelectedSongId(session.room.song_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (canUseBandPlayer(plan) && user && selectedSongId) {
      void createOrLoadRoom(instrument, selectedSongId);
    }
    // Initial room load only — instrument/song updates happen on picker click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, user, selectedSongId]);

  useEffect(() => {
    if (!room?.id) return;

    const supabase = createClient();
    const roomId = room.id;

    const fetchMembers = async () => {
      const { data } = await supabase
        .from('band_members')
        .select('*, profiles(full_name)')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });
      if (data) setMembers(data as BandMemberRecord[]);
    };

    const channel = supabase
      .channel(`band_lobby:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'band_members', filter: `room_id=eq.${roomId}` },
        () => { void fetchMembers(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [room?.id]);

  function pickInstrument(key: InstrumentKey) {
    setInstrument(key);
    if (room && selectedSongId) void createOrLoadRoom(key, selectedSongId);
  }

  function pickSong(songId: string) {
    setSelectedSongId(songId);
  }

  const joinLink = room ? bandJoinUrl(room.code) : '';
  const playerHref = room && selectedSongId
    ? `/player?room=${room.id}&songId=${encodeURIComponent(selectedSongId)}`
    : room
      ? `/player?room=${room.id}`
      : '#';

  function copy() {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!canUseBandPlayer(plan)) {
    return (
      <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 560 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <IconBand size={32} style={{ color: 'var(--acc)' }} />
          </div>
          <h1 className="h2" style={{ marginBottom: 8 }}>{t('room.createTitle')}</h1>
          <p className="muted" style={{ marginBottom: 24 }}>{t('room.bandOnly')}</p>
          <Link href="/profile" className="btn btn-primary">{t('room.getBanda')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <IconBand size={24} style={{ color: 'var(--acc)' }} />
        <div>
          <p className="eyebrow">{t('room.eyebrow')}</p>
          <h1 className="h2" style={{ marginTop: 4 }}>{t('room.createTitle')}</h1>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: 'var(--danger, #f87171)' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--danger, #f87171)' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('room.chooseSong')}
            </p>
            {songsLoading ? (
              <ClassicLoader size="sm" />
            ) : songs.length === 0 ? (
              <div>
                <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>{t('room.noSongsReady')}</p>
                <Link href="/upload" className="btn btn-ghost btn-sm">{t('dash.quickUpload')}</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {songs.map((song) => {
                  const active = song.id === selectedSongId;
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => pickSong(song.id)}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left',
                        background: active ? 'var(--acc-soft)' : 'var(--elev-2)',
                        border: `1px solid ${active ? 'var(--acc-line)' : 'var(--line)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, background: 'var(--elev-1)',
                        border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 16,
                        flexShrink: 0,
                      }}>{song.glyph}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {song.title}
                        </p>
                        <p className="muted" style={{ margin: '2px 0 0', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {song.artist}{song.isFeatured ? ` · ${t('dash.featTitle')}` : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedSong && (
              <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                {t('room.selectedSong')}: {selectedSong.title}
              </p>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('room.code')}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--acc)', margin: '0 0 14px', fontFamily: 'monospace', minHeight: 40, display: 'flex', alignItems: 'center' }}>
              {loading && !room ? <ClassicLoader size="sm" /> : room?.code ?? '—'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px' }}>{t('room.share')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={joinLink} className="input" style={{ fontSize: 13 }} />
              <button type="button" onClick={copy} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} disabled={!joinLink}>
                {copied ? t('room.copied') : t('room.copyLink')}
              </button>
            </div>
            {members.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
                  {t('room.inRoom')}: {members.length}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {members.map((m) => {
                    const { Icon } = INSTRUMENTS[m.instrument];
                    return (
                      <span key={m.id} className="band-dash-chip">
                        <Icon size={12} sw={1.5} />
                        {memberDisplayName(m)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="muted" style={{ fontSize: 13 }}>{t('room.syncNote')}</p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t('room.yourInst')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {INST_ORDER.map((key) => {
              const { Icon } = INSTRUMENTS[key];
              const active = instrument === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickInstrument(key)}
                  style={{
                    background: active ? 'var(--acc-soft)' : 'var(--elev-2)',
                    border: `1px solid ${active ? 'var(--acc-line)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: active ? 'var(--acc)' : 'var(--text-2)',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  <Icon size={16} />
                  {t(`inst.${key}`)}
                </button>
              );
            })}
          </div>

          {room && selectedSongId && (
            <Link
              href={playerHref}
              className="btn btn-primary btn-block"
              style={{ marginBottom: 10 }}
            >
              {t('dash.openRoom')}
            </Link>
          )}
          <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>{t('room.startHint')}</p>
        </div>
      </div>
    </div>
  );
}
