'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';
import { bandJoinUrl } from '@/lib/band-room';
import { canUseBandPlayer } from '@/lib/plan-access';
import { normalizePlan } from '@/lib/supabase/profile';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';
import { IconBand } from '@/components/ui/icons';

const SONG = LIBRARY[0];

export function BandScreen() {
  const { t } = useT();
  const { user, profile } = useSession();
  const plan = normalizePlan(profile?.plan);
  const [copied, setCopied] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentKey>('guitar');
  const [room, setRoom] = useState<BandRoomRecord | null>(null);
  const [members, setMembers] = useState<BandMemberRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrLoadRoom = useCallback(async (inst: InstrumentKey) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/band-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrument: inst, songId: SONG.id }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Could not create room');
      }
      const session = await res.json() as { room: BandRoomRecord; members: BandMemberRecord[] };
      setRoom(session.room);
      setMembers(session.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (canUseBandPlayer(plan) && user) {
      void createOrLoadRoom(instrument);
    }
    // Initial room load only — instrument updates happen on picker click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, user]);

  function pickInstrument(key: InstrumentKey) {
    setInstrument(key);
    if (room) void createOrLoadRoom(key);
  }

  const joinLink = room ? bandJoinUrl(room.code) : '';

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
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'var(--acc-soft)',
                border: '1px solid var(--acc-line)', display: 'grid', placeItems: 'center', fontSize: 18,
              }}>{SONG.glyph}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{SONG.title}</p>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{SONG.artist}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('room.code')}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--acc)', margin: '0 0 14px', fontFamily: 'monospace' }}>
              {loading && !room ? '…' : room?.code ?? '—'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 10px' }}>{t('room.share')}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={joinLink} className="input" style={{ fontSize: 13 }} />
              <button type="button" onClick={copy} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} disabled={!joinLink}>
                {copied ? t('room.copied') : t('room.copyLink')}
              </button>
            </div>
            {members.length > 0 && (
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                {t('room.inRoom')}: {members.length}
              </p>
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

          {room && (
            <Link
              href={`/player?room=${room.id}`}
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
