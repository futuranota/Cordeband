'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { DetectedInstrumentsBanner } from '@/components/instruments/DetectedInstrumentsBanner';
import { InstrumentPicker } from '@/components/instruments/InstrumentPicker';
import { MidiChannelSelector } from '@/components/instruments/MidiChannelSelector';
import { MidiUploadTermsDialog } from '@/components/player/MidiUploadTermsDialog';
import { hasAcceptedMidiUploadTerms } from '@/lib/midi-upload-terms';
import { useMidiChannelDetection } from '@/hooks/useMidiChannelDetection';
import type { InstrumentKey } from '@/lib/data';
import type { InstrumentDetectionMode } from '@/lib/instrument-detection';
import { instrumentBannerKeys } from '@/lib/instrument-detection';
import {
  clearStudioInstrumentsForUpload,
  readStudioInstrumentsForUpload,
} from '@/lib/studio-config';
import { IconUpload, IconCheck, IconSpin, IconCart, IconExternal, IconWave, IconArrow } from '@/components/ui/icons';

type Stage = 'idle' | 'uploading' | 'error';

const AUDIO_ACCEPT = '.mp3,.wav,.flac,audio/*';
const MAX_BYTES = 52_428_800;

function MidiAttach({
  midiFile,
  onMidiChange,
  disabled,
  instruments,
  onChannelSelect,
}: {
  midiFile: File | null;
  onMidiChange: (file: File | null) => void;
  disabled?: boolean;
  instruments: InstrumentKey[];
  onChannelSelect?: (channel: number | null) => void;
}) {
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { detection, selectedChannel, setSelectedChannel, detectChannels } = useMidiChannelDetection();

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.name.match(/\.midi?$/i)) {
      setError(t('up.midiFormat'));
      return;
    }
    onMidiChange(file);
    onChannelSelect?.(null);
    // Detect channels if instruments are selected
    if (instruments.length > 0) {
      void detectChannels(file, instruments[0]);
    }
  }

  function handleChannelSelect(channel: number) {
    setSelectedChannel(channel);
    onChannelSelect?.(channel);
  }

  function openPicker() {
    if (hasAcceptedMidiUploadTerms()) {
      inputRef.current?.click();
    } else {
      setTermsOpen(true);
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        <label className="field-label">{t('up.midiLabel')}</label>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>{t('up.midiHint')}</p>
        {midiFile ? (
          <div className="row spread">
            <span style={{ fontSize: 13.5 }}>{t('up.midiSelected')} {midiFile.name}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => { onMidiChange(null); }}>
              {t('up.midiRemove')}
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={openPicker}>
            <IconUpload size={14} /> {t('up.midiAttach')}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".mid,.midi,audio/midi"
          hidden
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0' }}>{error}</p>
        )}
        <MidiUploadTermsDialog
          open={termsOpen}
          onCancel={() => setTermsOpen(false)}
          onAccepted={() => {
            setTermsOpen(false);
            inputRef.current?.click();
          }}
        />
      </div>

      {detection && (
        <MidiChannelSelector
          detection={detection}
          selectedChannel={selectedChannel}
          onChannelSelect={handleChannelSelect}
          disabled={disabled}
        />
      )}
    </>
  );
}

function Dropzone({
  onPick,
  disabled,
  instruments,
  onInstrumentsChange,
  instrumentError,
  midiFile,
  onMidiChange,
  onMidiChannelSelect,
  fromStudio,
}: {
  onPick: (file: File) => void;
  disabled?: boolean;
  instruments: InstrumentKey[];
  onInstrumentsChange: (next: InstrumentKey[]) => void;
  instrumentError: string | null;
  midiFile: File | null;
  onMidiChange: (file: File | null) => void;
  onMidiChannelSelect?: (channel: number | null) => void;
  fromStudio?: boolean;
}) {
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

      <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        {fromStudio && (
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>{t('up.fromStudioBanner')}</p>
        )}
        <InstrumentPicker
          value={instruments}
          onChange={onInstrumentsChange}
          disabled={disabled}
          error={instrumentError}
        />
      </div>

      <MidiAttach
        midiFile={midiFile}
        onMidiChange={onMidiChange}
        disabled={disabled}
        instruments={instruments}
        onChannelSelect={onMidiChannelSelect}
      />

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

function parseInstruments(raw: unknown): InstrumentKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((k): k is InstrumentKey => typeof k === 'string');
}

export function ProcessingStatus({
  fileName,
  songId,
  midiWarning,
  onDone,
  onFailed,
  onCancel,
}: {
  fileName: string;
  songId: string;
  midiWarning: string | null;
  onDone: () => void;
  onFailed: (message: string) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [pct, setPct] = useState(5);
  const [finished, setFinished] = useState(false);
  const [detected, setDetected] = useState<InstrumentKey[]>([]);
  const [detectionMode, setDetectionMode] = useState<InstrumentDetectionMode>('manual');
  const bannerKeys = instrumentBannerKeys(detectionMode);

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
    if (data.detectionMode === 'auto' || data.detectionMode === 'manual') {
      setDetectionMode(data.detectionMode);
    }

    if (data.job?.status === 'failed') {
      onFailed(data.job.error_message ?? t('up.errB'));
      return true;
    }

    if (data.songStatus === 'ready' || data.job?.status === 'completed') {
      setPct(100);
      setDetected(parseInstruments(data.instruments));
      setFinished(true);
      return true;
    }

    return false;
  }, [songId, onFailed, t]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      let pollErrors = 0;
      const maxPollErrors = 8;

      while (!cancelled) {
        try {
          const done = await checkJob();
          pollErrors = 0;
          if (done) return;
        } catch {
          pollErrors += 1;
          if (pollErrors >= maxPollErrors && !cancelled) {
            onFailed(t('up.errPoll'));
            return;
          }
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
      {midiWarning && (
        <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>{midiWarning}</p>
      )}
      <div className="card proc-card">
        <div className="row spread" style={{ marginBottom: 20 }}>
          <div className="row gap-12">
            <span className="logo-mark" style={{ width: 42, height: 42, borderRadius: 10 }}><IconWave size={20} /></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fileName}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {finished ? t('up.p4t') : t('up.uploading')}
              </div>
            </div>
          </div>
          {!finished && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>{t('up.cancel')}</button>
          )}
        </div>
        <div className="proc-progress"><i style={{ width: `${pct}%` }} /></div>
        {!finished ? (
          <>
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
          </>
        ) : (
          <>
            <DetectedInstrumentsBanner
              instruments={detected}
              titleKey={bannerKeys.titleKey}
              subKey={bannerKeys.subKey}
            />
            <div className="row center" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-primary btn-lg" onClick={onDone}>
                {t('up.chooseInstrument')} <IconArrow size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function UploadScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const fromStudio = searchParams.get('from') === 'studio';
  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState('');
  const [songId, setSongId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [instruments, setInstruments] = useState<InstrumentKey[]>(['guitar']);
  const [instrumentError, setInstrumentError] = useState<string | null>(null);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [midiSelectedChannel, setMidiSelectedChannel] = useState<number | null>(null);
  const [midiWarning, setMidiWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!fromStudio) return;
    const preset = readStudioInstrumentsForUpload();
    if (preset?.length) {
      setInstruments(preset);
    }
  }, [fromStudio]);

  async function startProcess(file: File) {
    if (!instruments.length) {
      setInstrumentError(t('up.instrumentsRequired'));
      return;
    }

    setFileName(file.name);
    setErrorMessage(null);
    setInstrumentError(null);
    setMidiWarning(null);
    setSubmitting(true);
    setStage('uploading');

    let createdSongId: string | null = null;

    try {
      const initRes = await fetch('/api/songs/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || 'audio/mpeg',
          instruments,
        }),
      });

      if (initRes.status === 413) {
        throw new Error(t('up.errSize'));
      }

      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        throw new Error(initData.error ?? t('up.errB'));
      }

      createdSongId = initData.song.id as string;
      const uploadRes = await fetch(initData.upload.signedUrl as string, {
        method: 'PUT',
        headers: {
          'Content-Type': initData.upload.contentType as string,
          'x-upsert': 'true',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(t('up.errB'));
      }

      if (midiFile) {
        try {
          const midiForm = new FormData();
          midiForm.append('file', midiFile);
          midiForm.append('instrument', instruments[0]);
          if (midiSelectedChannel !== null) {
            midiForm.append('channel', midiSelectedChannel.toString());
          }
          const midiRes = await fetch(`/api/songs/${createdSongId}/midi`, { method: 'POST', body: midiForm });
          if (!midiRes.ok) {
            setMidiWarning(t('up.midiUploadFailed'));
          }
        } catch {
          // Non-fatal: the song still uploads with the AI score if this fails.
          setMidiWarning(t('up.midiUploadFailed'));
        }
      }

      const completeRes = await fetch(`/api/songs/${createdSongId}/upload-complete`, {
        method: 'POST',
      });
      const completeData = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) {
        throw new Error(completeData.error ?? t('up.errB'));
      }

      setSongId(createdSongId);
    } catch (err) {
      if (createdSongId) {
        void fetch(`/api/songs/${createdSongId}`, { method: 'DELETE' });
      }
      setStage('error');
      setErrorMessage(err instanceof Error ? err.message : t('up.errB'));
    } finally {
      setSubmitting(false);
    }
  }

  function onDone() {
    if (fromStudio) {
      clearStudioInstrumentsForUpload();
    }
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
        midiWarning={midiWarning}
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

  return (
    <Dropzone
      onPick={startProcess}
      disabled={submitting}
      instruments={instruments}
      onInstrumentsChange={(next) => {
        setInstruments(next);
        if (next.length) setInstrumentError(null);
      }}
      instrumentError={instrumentError}
      midiFile={midiFile}
      onMidiChange={setMidiFile}
      onMidiChannelSelect={setMidiSelectedChannel}
      fromStudio={fromStudio}
    />
  );
}