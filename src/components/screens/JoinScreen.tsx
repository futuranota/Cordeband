'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';
import { IconArrowL, IconBand } from '@/components/ui/icons';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { LoadingButton } from '@/components/ui/LoadingButton';

type JoinLookup = {
  room: { id: string; code: string; status: string; songId: string | null };
  takenInstruments: InstrumentKey[];
};

type JoinScreenProps = {
  token: string;
};

export function JoinScreen({ token }: JoinScreenProps) {
  const { t } = useT();
  const router = useRouter();
  const [lookup, setLookup] = useState<JoinLookup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState<InstrumentKey>('guitar');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    fetch(`/api/band-rooms/lookup?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error ?? t('bandJoin.notFound'));
        }
        return res.json() as Promise<JoinLookup>;
      })
      .then((data) => {
        if (!cancelled) setLookup(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : t('bandJoin.notFound'));
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  useEffect(() => {
    if (!lookup) return;
    const firstOpen = INST_ORDER.find((k) => !lookup.takenInstruments.includes(k));
    if (firstOpen) setInstrument(firstOpen);
  }, [lookup]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!lookup) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setSubmitError(t('bandJoin.nameRequired'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const supabase = createClient();
      let { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) throw error ?? new Error(t('bandJoin.joinError'));
        user = data.user;
      }

      const res = await fetch('/api/band-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: lookup.room.code,
          instrument,
          guestName: trimmed,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload.error ?? t('bandJoin.joinError');
        if (typeof msg === 'string' && msg.toLowerCase().includes('instrument')) {
          throw new Error(t('bandJoin.instrumentTaken'));
        }
        throw new Error(msg);
      }

      router.push(`/player?room=${lookup.room.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('bandJoin.joinError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="wrap page" style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 480 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <IconBand size={32} style={{ color: 'var(--acc)', marginBottom: 16 }} />
          <h1 className="h2" style={{ marginBottom: 8 }}>{t('bandJoin.notFound')}</h1>
          <p className="muted" style={{ marginBottom: 24 }}>{loadError}</p>
          <Link href="/" className="btn btn-ghost">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  if (!lookup) {
    return (
      <div className="wrap page loader-center" style={{ paddingTop: 80 }}>
        <ClassicLoader />
      </div>
    );
  }

  if (lookup.room.status === 'ended') {
    return (
      <div className="wrap page" style={{ paddingTop: 64, paddingBottom: 80, maxWidth: 480 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <h1 className="h2" style={{ marginBottom: 8 }}>{t('bandJoin.ended')}</h1>
          <Link href="/" className="btn btn-ghost" style={{ marginTop: 16 }}>{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  const song = LIBRARY[0];

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 520 }}>
      <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <IconArrowL size={15} /> {t('common.back')}
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <IconBand size={24} style={{ color: 'var(--acc)' }} />
        <div>
          <p className="eyebrow">{t('room.joinTitle')}</p>
          <h1 className="h2" style={{ marginTop: 4 }}>{t('room.joinSub')}</h1>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
          {t('room.code')}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--acc)', margin: '0 0 16px' }}>
          {lookup.room.code}
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'var(--acc-soft)',
            border: '1px solid var(--acc-line)', display: 'grid', placeItems: 'center', fontSize: 18,
          }}>{song.glyph}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>{song.title}</p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{song.artist}</p>
          </div>
        </div>
      </div>

      <form className="card" style={{ padding: 24 }} onSubmit={handleJoin}>
        <label className="field" style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'block' }}>{t('room.yourName')}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('room.yourNamePh')}
            autoComplete="name"
            maxLength={48}
          />
        </label>

        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>{t('room.pickInst')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {INST_ORDER.map((key) => {
            const { Icon } = INSTRUMENTS[key];
            const taken = lookup.takenInstruments.includes(key);
            const active = instrument === key;
            return (
              <button
                key={key}
                type="button"
                disabled={taken}
                onClick={() => setInstrument(key)}
                style={{
                  background: taken ? 'var(--elev-1)' : active ? 'var(--acc-soft)' : 'var(--elev-2)',
                  border: `1px solid ${active ? 'var(--acc-line)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 10px',
                  cursor: taken ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: taken ? 'var(--text-4)' : active ? 'var(--acc)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: 600, opacity: taken ? 0.55 : 1,
                }}
              >
                <Icon size={16} />
                {t(`inst.${key}`)}
                {taken && <span style={{ marginLeft: 'auto', fontSize: 10 }}>{t('bandJoin.taken')}</span>}
              </button>
            );
          })}
        </div>

        {submitError && (
          <p style={{ color: 'var(--danger, #f87171)', fontSize: 13, marginBottom: 12 }}>{submitError}</p>
        )}

        <LoadingButton type="submit" className="btn btn-primary btn-block" loading={submitting}>
          {t('room.joinAs')}
        </LoadingButton>
      </form>
    </div>
  );
}
