'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { IconUpload, IconCheck, IconSpin, IconCart, IconExternal, IconWave } from '@/components/ui/icons';

type Stage = 'idle' | 'uploading' | 'error';

const AUDIO_ACCEPT = '.mp3,.wav,.flac,audio/*';
const MAX_BYTES = 52_428_800;

function Dropzone({ onPick, disabled }: { onPick: (file: File) => void; disabled?: boolean }) {
  const { t } = useT();
  const [drag, setDrag] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    setPickError(null);
    if (file.size > MAX_BYTES) {
      setPickError(t('up.errSize'));
      return;
    }
    if (!file.name.match(/\.(mp3|wav|flac)$/i) && !file.type.startsWith('audio/')) {
      setPickError(t('up.errFormat'));
      return;
    }
    onPick(file);
  }

  return (
    <div className="upload-wrap page">
      <div className="section-head" style={{ textAlign: 'center', margin: '0 auto 34px', maxWidth: 'none' }}>
        <span className="eyebrow">{t('up.eyebrow')}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>{t('up.title')}</h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '50ch' }}>{t('up.sub')}</p>
      </div>

      <div
        className={`dropzone${drag ? ' drag' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={AUDIO_ACCEPT}
          hidden
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="dz-icon"><IconUpload size={28} /></div>
        <div className="h3 serif">{t('up.drop')}</div>
        <p className="muted" style={{ margin: '8px 0 0' }}>{t('up.click')}</p>
        <div className="dz-formats">
          {['MP3', 'WAV', 'FLAC'].map((f) => (
            <span key={f} className="pill">{f}</span>
          ))}
        </div>
      </div>

      {pickError && (
        <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 14 }}>{pickError}</p>
      )}

      <div className="suggest">
        <span className="logo-mark" style={{ background: 'var(--elev-3)', color: 'var(--acc)', border: '1px solid var(--line)' }}>
          <IconCart size={16} />
        </span>
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 14 }}>{t('up.suggestT')}</div>
          <div className="muted" style={{ fontSize: 13 }}>{t('up.suggestB')}</div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm">{t('up.search')} <IconExternal size={14} /></button>
      </div>
    </div>
  );
}

function ProcessingStatus({
  fileName,
  songId,
  onDone,
  onFailed,
  onCancel,
}: {
  fileName: string;
  songId: string;
  onDone: () => void;
  onFailed: (message: string) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [pct, setPct] = useState(5);

  const PROC_STEPS = [
    { label: t('up.p1t'), sub: t('up.p1b') },
    { label: t('up.p2t'), sub: t('up.p2b') },
    { label: t('up.p3t'), sub: t('up.p3b') },
    { label: t('up.p4t'), sub: t('up.p4b') },
  ];

  const checkJob = useCallback(async () => {
    const res = await fetch(`/api/songs/${songId}/job`);
    if (!res.ok) throw new Error('Job poll failed');
    const data = await res.json();

    if (data.job?.progress_pct != null) setPct(data.job.progress_pct);

    if (data.job?.status === 'failed') {
      onFailed(data.job.error_message ?? t('up.errB'));
      return true;
    }

    if (data.songStatus === 'ready' || data.job?.status === 'completed') {
      setPct(100);
      setTimeout(onDone, 650);
      return true;
    }

    return false;
  }, [songId, onDone, onFailed, t]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const done = await checkJob();
          if (done) return;
        } catch {
          if (!cancelled) onFailed(t('up.errB'));
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [checkJob, onFailed, t]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`processing_job:${songId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'processing_jobs', filter: `song_id=eq.${songId}` },
        () => { void checkJob(); },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [songId, checkJob]);

  const activeStep = pct >= 95 ? 3 : pct >= 75 ? 2 : pct >= 45 ? 1 : 0;

  return (
    <div className="upload-wrap page">
      <div className="card proc-card">
        <div className="row spread" style={{ marginBottom: 20 }}>
          <div className="row gap-12">
            <span className="logo-mark" style={{ width: 42, height: 42, borderRadius: 10 }}><IconWave size={20} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fileName}</div>
              <div className="muted" style={{ fontSize: 13 }}>{t('up.uploading')}</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>{t('up.cancel')}</button>
        </div>
        <div className="proc-progress"><i style={{ width: `${pct}%` }} /></div>
        <div className="proc-steps">
          {PROC_STEPS.map((s, i) => {
            const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending';
            return (
              <div key={i} className={`proc-step ${state}`}>
                <span className="proc-dot">
                  {state === 'done' ? <IconCheck size={13} sw={2.5} /> : state === 'active' ? <IconSpin size={14} className="spin" /> : i + 1}
                </span>
                <div>
                  <div className="pl">{s.label}</div>
                  <div className="ps">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>{t('up.takes')}</p>
      </div>
    </div>
  );
}

export function UploadScreen() {
  const router = useRouter();
  const { t } = useT();
  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState('');
  const [songId, setSongId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function startProcess(file: File) {
    setFileName(file.name);
    setErrorMessage(null);
    setSubmitting(true);
    setStage('uploading');

    const form = new FormData();
    form.set('audio', file);

    try {
      const res = await fetch('/api/songs', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('up.errB'));
      setSongId(data.song.id as string);
    } catch (err) {
      setStage('error');
      setErrorMessage(err instanceof Error ? err.message : t('up.errB'));
    } finally {
      setSubmitting(false);
    }
  }

  function onDone() {
    if (songId) {
      router.push(`/instrument?songId=${encodeURIComponent(songId)}`);
      return;
    }
    router.push('/instrument');
  }

  if (stage === 'error') {
    return (
      <div className="upload-wrap page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2 className="h2">{t('up.errT')}</h2>
        <p className="muted" style={{ marginTop: 12 }}>{errorMessage ?? t('up.errB')}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => { setStage('idle'); setSongId(null); }}>
          {t('up.chooseOther')}
        </button>
      </div>
    );
  }

  if (stage === 'uploading' && songId) {
    return (
      <ProcessingStatus
        fileName={fileName}
        songId={songId}
        onDone={onDone}
        onFailed={(msg) => { setErrorMessage(msg); setStage('error'); }}
        onCancel={() => { setStage('idle'); setSongId(null); }}
      />
    );
  }

  if (stage === 'uploading') {
    return (
      <div className="upload-wrap page">
        <div className="card proc-card">
          <div className="row gap-12">
            <span className="logo-mark" style={{ width: 42, height: 42, borderRadius: 10 }}><IconWave size={20} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fileName}</div>
              <div className="muted" style={{ fontSize: 13 }}>{t('up.uploading')}</div>
            </div>
            <IconSpin size={18} className="spin" />
          </div>
        </div>
      </div>
    );
  }

  return <Dropzone onPick={startProcess} disabled={submitting} />;
}
