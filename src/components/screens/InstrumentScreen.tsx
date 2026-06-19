'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';
import {
  fetchSongById,
  fetchStemInstruments,
  saveActiveSongId,
  saveInstrumentConfirmedFor,
} from '@/lib/supabase/fetch-song';
import type { Song } from '@/lib/data';
import { StagePanel } from '@/components/player/StagePanel';
import { DetectedInstrumentsBanner } from '@/components/instruments/DetectedInstrumentsBanner';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { IconArrow, IconArrowL, IconCheck } from '@/components/ui/icons';
import type { InstrumentDetectionMode } from '@/lib/instrument-detection';
import { instrumentBannerKeys, instrumentSelectorBannerKey } from '@/lib/instrument-detection';

const DEMO_SONG = LIBRARY[0];

function InstrumentScreenInner() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get('songId');

  const [song, setSong] = useState<Song | null>(null);
  const [stemInstruments, setStemInstruments] = useState<InstrumentKey[]>([]);
  const [loading, setLoading] = useState(!!songId);
  const [error, setError] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<InstrumentDetectionMode>('manual');

  const activeSong = song ?? (songId ? null : DEMO_SONG);
  const playableInstruments = useMemo(() => {
    const fromSong = activeSong?.instruments ?? [];
    if (fromSong.length) return fromSong;
    return stemInstruments;
  }, [activeSong?.instruments, stemInstruments]);

  const available = useMemo(() => new Set(playableInstruments), [playableInstruments]);
  const [sel, setSel] = useState<InstrumentKey | null>(null);
  const bannerKeys = instrumentBannerKeys(detectionMode);
  const isManual = detectionMode === 'manual';
  const ready = !song?.status || song.status === 'ready';
  const canEnter = !!sel && ready && available.has(sel);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/processing-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.detectionMode === 'auto' || data.detectionMode === 'manual') {
          setDetectionMode(data.detectionMode);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!songId) {
      setSong(null);
      setStemInstruments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchSongById(songId).then((fetched) => {
      if (cancelled) return;
      if (!fetched) {
        setError(t('sel.songNotFound'));
        setSong(null);
        setStemInstruments([]);
      } else if (fetched.status && fetched.status !== 'ready') {
        setError(t('sel.songProcessing'));
        setSong(fetched);
      } else {
        setSong(fetched);
        saveActiveSongId(fetched.id);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [songId, t]);

  useEffect(() => {
    if (!songId || !song || song.status === 'ready') return;

    let cancelled = false;
    const poll = window.setInterval(() => {
      void fetchSongById(songId).then((fetched) => {
        if (cancelled || !fetched) return;
        setSong(fetched);
        if (fetched.status === 'ready') {
          setError(null);
          saveActiveSongId(fetched.id);
        }
      });
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [songId, song?.status]);

  useEffect(() => {
    if (!songId || (song?.instruments.length ?? 0) > 0) return;

    let cancelled = false;
    void fetchStemInstruments(songId).then((stems) => {
      if (!cancelled) setStemInstruments(stems);
    });

    return () => { cancelled = true; };
  }, [songId, song?.instruments.length, song?.status]);

  useEffect(() => {
    if (!playableInstruments.length) {
      setSel(null);
      return;
    }
    const insts = new Set(playableInstruments);
    setSel((prev) => {
      if (prev && insts.has(prev)) return prev;
      return insts.has('guitar') ? 'guitar' : playableInstruments[0];
    });
  }, [activeSong?.id, playableInstruments.join(',')]);

  function chooseInstrument(key: InstrumentKey) {
    localStorage.setItem('cordeband_instrument', key);
    const id = songId ?? activeSong?.id;
    if (id) {
      saveActiveSongId(id);
      saveInstrumentConfirmedFor(id);
    }
    const qs = id ? `?songId=${encodeURIComponent(id)}` : '';
    router.push(`/player${qs}`);
  }

  if (loading) {
    return (
      <div className="loader-center" style={{ minHeight: '60vh' }}>
        <ClassicLoader />
      </div>
    );
  }

  if (error && !playableInstruments.length) {
    return (
      <main className="wrap app-main page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2 className="h2">{error}</h2>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 24 }}>
          {t('nav.library')}
        </Link>
      </main>
    );
  }

  return (
    <main className="wrap app-main page" style={{ maxWidth: 900 }}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
        <IconArrowL size={15} /> {t('nav.library')}
      </Link>

      <div style={{ textAlign: 'center' }}>
        <span className="eyebrow">{activeSong?.title ?? '—'}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>{t('sel.whatPlay')}</h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '44ch' }}>
          {isManual ? t('sel.subManual') : t('sel.sub')}
        </p>
        {error && (
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>{error}</p>
        )}
        {!ready && playableInstruments.length > 0 && (
          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>{t('sel.songProcessing')}</p>
        )}
      </div>

      <div style={{ marginTop: 36 }}>
        <StagePanel
          instruments={playableInstruments}
          youKey={sel}
          title={t('sel.stageTitle')}
          sub={t('sel.stageSub')}
        />
      </div>

      {playableInstruments.length > 0 && activeSong && (
        <DetectedInstrumentsBanner
          instruments={playableInstruments}
          titleKey={instrumentSelectorBannerKey(detectionMode)}
          subKey={bannerKeys.subKey}
        />
      )}

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
              title={!on ? (isManual ? t('sel.notIndicatedHint') : t('sel.notDetectedHint')) : undefined}
              aria-disabled={!on}
              onClick={() => on && setSel(k)}
            >
              {isSel && (
                <span className="inst-check"><IconCheck size={13} sw={2.4} /></span>
              )}
              <span className="inst-ico"><Icon size={34} sw={1.4} /></span>
              <span className="inst-name">{t(`inst.${k}`)}</span>
              <span className="inst-state">
                {on ? (k === 'guitar' ? t('sel.last') : t('common.available')) : (isManual ? t('sel.notIndicated') : t('sel.notDetected'))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="row center" style={{ marginTop: 40 }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!canEnter}
          onClick={() => sel && chooseInstrument(sel)}
        >
          {t('sel.enter')} <IconArrow size={17} />
        </button>
      </div>
    </main>
  );
}

export function InstrumentScreen() {
  return (
    <Suspense fallback={<div className="loader-center" style={{ minHeight: '60vh' }}><ClassicLoader /></div>}>
      <InstrumentScreenInner />
    </Suspense>
  );
}
