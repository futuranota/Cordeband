'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { INST_ORDER, INSTRUMENTS, LIBRARY, type InstrumentKey } from '@/lib/data';
import { fetchSongById, saveActiveSongId } from '@/lib/supabase/fetch-song';
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
  const [loading, setLoading] = useState(!!songId);
  const [error, setError] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<InstrumentDetectionMode>('manual');

  const activeSong = song ?? (songId ? null : DEMO_SONG);
  const available = new Set(activeSong?.instruments ?? []);
  const [sel, setSel] = useState<InstrumentKey | null>(null);
  const bannerKeys = instrumentBannerKeys(detectionMode);
  const isManual = detectionMode === 'manual';

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
    if (!activeSong) return;
    const insts = new Set(activeSong.instruments);
    setSel(insts.has('guitar') ? 'guitar' : activeSong.instruments[0] ?? null);
  }, [activeSong?.id, activeSong?.instruments.join(',')]);

  function chooseInstrument(key: InstrumentKey) {
    localStorage.setItem('cordeband_instrument', key);
    const id = songId ?? activeSong?.id;
    if (id) saveActiveSongId(id);
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

  if (error && !activeSong?.instruments.length) {
    return (
      <main className="wrap app-main page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2 className="h2">{error}</h2>
        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 24 }}>
          {t('nav.library')}
        </Link>
      </main>
    );
  }

  const ready = !song?.status || song.status === 'ready';

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
      </div>

      <div style={{ marginTop: 36 }}>
        <StagePanel
          instruments={activeSong?.instruments ?? []}
          youKey={sel}
          title={t('sel.stageTitle')}
          sub={t('sel.stageSub')}
        />
      </div>

      {(activeSong?.instruments?.length ?? 0) > 0 && activeSong && (
        <DetectedInstrumentsBanner
          instruments={activeSong.instruments}
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
          disabled={!sel || !ready}
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
