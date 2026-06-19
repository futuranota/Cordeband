'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/context';
import { DetectedInstrumentsBanner } from '@/components/instruments/DetectedInstrumentsBanner';
import { InstrumentPicker } from '@/components/instruments/InstrumentPicker';
import type { Song } from '@/lib/data';
import type { InstrumentKey } from '@/lib/data';
import type { InstrumentDetectionMode } from '@/lib/instrument-detection';
import { instrumentBannerKeys } from '@/lib/instrument-detection';
import { IconCheck, IconSpin, IconWave } from '@/components/ui/icons';
import { LoadingButton } from '@/components/ui/LoadingButton';

type Props = {
  onSaved: (song: Song) => void;
  onCancel: () => void;
};

function parseInstruments(raw: unknown): InstrumentKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((k): k is InstrumentKey => typeof k === 'string');
}

function JobProgress({ fileName, songId, onDone, onFailed }: {
  fileName: string;
  songId: string;
  onDone: (song: Song) => void;
  onFailed: (message: string) => void;
}) {
  const { t } = useT();
  const [pct, setPct] = useState(5);
  const [finished, setFinished] = useState(false);
  const [detected, setDetected] = useState<InstrumentKey[]>([]);
  const [savedSong, setSavedSong] = useState<Song | null>(null);
  const [detectionMode, setDetectionMode] = useState<InstrumentDetectionMode>('manual');
  const bannerKeys = instrumentBannerKeys(detectionMode);

  const PROC_STEPS = [
    { label: t('up.p1t'), sub: t('up.p1b') },
    { label: t('up.p2t'), sub: t('up.p2b') },
    { label: t('up.p3t'), sub: t('up.p3b') },
    { label: t('up.p4t'), sub: t('up.p4b') },
  ];

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/admin/featured-songs/${songId}/job`);
          if (!res.ok) throw new Error('Job poll failed');
          const data = await res.json();
          if (data.job?.progress_pct != null) setPct(data.job.progress_pct);
          if (data.detectionMode === 'auto' || data.detectionMode === 'manual') {
            setDetectionMode(data.detectionMode);
          }

          if (data.job?.status === 'failed') {
            onFailed(data.job.error_message ?? t('admin.featUploadError'));
            return;
          }

          if (data.songStatus === 'ready' || data.job?.status === 'completed') {
            setPct(100);
            setDetected(parseInstruments(data.instruments));
            const listRes = await fetch('/api/admin/featured-songs');
            const listData = await listRes.json();
            const song = (listData.songs as Song[] | undefined)?.find((s) => s.id === songId);
            if (song) {
              setSavedSong(song);
              setFinished(true);
            }
            return;
          }
        } catch {
          onFailed(t('admin.featUploadError'));
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [songId, onDone, onFailed, t]);

  const activeStep = pct >= 95 ? 3 : pct >= 75 ? 2 : pct >= 45 ? 1 : 0;

  return (
    <div className="card proc-card" style={{ marginBottom: 24 }}>
      <div className="row gap-12" style={{ marginBottom: 20 }}>
        <span className="logo-mark" style={{ width: 42, height: 42, borderRadius: 10 }}>
          <IconWave size={20} />
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fileName}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {finished ? t('up.p4t') : t('admin.uploadingFeat')}
          </div>
        </div>
      </div>
      <div className="proc-progress"><i style={{ width: `${pct}%` }} /></div>
      {!finished ? (
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
      ) : (
        <>
          <DetectedInstrumentsBanner
            instruments={detected}
            titleKey={bannerKeys.titleKey}
            subKey={bannerKeys.subKey}
          />
          <div className="row" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => savedSong && onDone(savedSong)}
            >
              {t('admin.featProcessSave')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function FeaturedSongForm({ onSaved, onCancel }: Props) {
  const { t } = useT();
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingSongId, setProcessingSongId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instruments, setInstruments] = useState<InstrumentKey[]>([]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !audioFile) {
      setError(t('admin.featFormRequired'));
      return;
    }
    if (!instruments.length) {
      setError(t('admin.featInstrumentsRequired'));
      return;
    }

    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set('title', title.trim());
    form.set('artist', artist.trim());
    form.set('description', description.trim());
    form.set('isAiGenerated', String(isAiGenerated));
    form.set('audio', audioFile);
    for (const inst of instruments) form.append('instruments', inst);
    if (coverFile) form.set('cover', coverFile);

    try {
      const res = await fetch('/api/admin/featured-songs', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('admin.featUploadError'));
      setProcessingSongId(data.song.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.featUploadError'));
      setSubmitting(false);
    }
  }

  if (processingSongId && audioFile) {
    return (
      <JobProgress
        fileName={audioFile.name}
        songId={processingSongId}
        onDone={(song) => {
          setSubmitting(false);
          onSaved(song);
        }}
        onFailed={(msg) => {
          setProcessingSongId(null);
          setSubmitting(false);
          setError(msg);
        }}
      />
    );
  }

  return (
    <form className="card" style={{ padding: 24, marginBottom: 24 }} onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="field-label">{t('admin.featSongTitle')} *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('admin.featSongTitlePh')} />
        </div>
        <div>
          <label className="field-label">{t('admin.featArtist')}</label>
          <input className="input" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={t('admin.featArtistPh')} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">{t('admin.featDescription')}</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('admin.featDescriptionPh')}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label className="field-label">{t('admin.featAudio')} *</label>
          <input
            ref={audioRef}
            type="file"
            accept=".mp3,.wav,.flac,audio/*"
            hidden
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => audioRef.current?.click()}>
            {audioFile ? audioFile.name : t('admin.featAudioPick')}
          </button>
        </div>
        <div>
          <label className="field-label">{t('admin.featCover')}</label>
          <input
            ref={coverRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => coverRef.current?.click()}>
            {coverFile ? coverFile.name : t('admin.uploadImg')}
          </button>
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="" style={{ marginTop: 10, width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
          )}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="row gap-8" style={{ cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={isAiGenerated} onChange={(e) => setIsAiGenerated(e.target.checked)} />
            {t('admin.featAiGenerated')}
          </label>
        </div>
        <InstrumentPicker
          value={instruments}
          onChange={setInstruments}
          disabled={submitting}
          labelKey="up.instrumentsLabel"
          hintKey="up.instrumentsHint"
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '14px 0 0' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <LoadingButton className="btn btn-primary btn-sm" type="submit" loading={submitting}>
          {t('admin.featProcessSave')}
        </LoadingButton>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel} disabled={submitting}>
          {t('admin.cancel')}
        </button>
      </div>
    </form>
  );
}
