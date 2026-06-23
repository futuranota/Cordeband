'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { ProcessingStatus } from '@/components/screens/UploadScreen';
import { IconUpload, IconWave } from '@/components/ui/icons';

const AUDIO_ACCEPT = '.mp3,.wav,.flac,audio/*';
const MAX_BYTES = 52_428_800;

type Stage = 'idle' | 'uploading' | 'processing' | 'error';

export function ReactivateScreen({ songId, songTitle }: { songId: string; songTitle: string }) {
  const { t } = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file || stage === 'uploading' || stage === 'processing') return;
    setPickError(null);
    if (file.size > MAX_BYTES) {
      setPickError(t('up.errSize'));
      return;
    }
    if (!file.name.match(/\.(mp3|wav|flac)$/i) && !file.type.startsWith('audio/')) {
      setPickError(t('up.errFormat'));
      return;
    }
    void startReplace(file);
  }

  async function startReplace(file: File) {
    setFileName(file.name);
    setStage('uploading');
    try {
      const initRes = await fetch(`/api/songs/${songId}/replace-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || 'audio/mpeg',
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        throw new Error(initData.error ?? t('up.errB'));
      }

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

      const reprocessRes = await fetch(`/api/songs/${songId}/reprocess`, { method: 'POST' });
      const reprocessData = await reprocessRes.json().catch(() => ({}));
      if (!reprocessRes.ok) {
        throw new Error(reprocessData.error ?? t('up.errB'));
      }

      setStage('processing');
    } catch (err) {
      setStage('error');
      setPickError(err instanceof Error ? err.message : t('up.errB'));
    }
  }

  if (stage === 'processing') {
    return (
      <ProcessingStatus
        fileName={fileName}
        songId={songId}
        midiWarning={null}
        onDone={() => router.push(`/player?id=${songId}`)}
        onFailed={(message) => { setStage('error'); setPickError(message); }}
        onCancel={() => router.push('/dashboard')}
      />
    );
  }

  const disabled = stage === 'uploading';

  return (
    <div className="upload-wrap page">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="row gap-12" style={{ marginBottom: 16 }}>
          <span className="logo-mark" style={{ width: 42, height: 42, borderRadius: 10 }}><IconWave size={20} /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{songTitle}</div>
            <div className="muted" style={{ fontSize: 13 }}>{t('dash.reactivateSubtitle')}</div>
          </div>
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
          <div className="h3 serif">{disabled ? t('up.uploading') : t('up.drop')}</div>
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
      </div>
    </div>
  );
}
