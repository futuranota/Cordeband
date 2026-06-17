'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconUpload, IconCheck, IconSpin, IconCart, IconExternal, IconWave } from '@/components/ui/icons';

type Stage = 'idle' | 'uploading' | 'error';

function Dropzone({ onPick }: { onPick: (name: string) => void }) {
  const { t } = useT();
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="upload-wrap page">
      <div className="section-head" style={{ textAlign: 'center', margin: '0 auto 34px', maxWidth: 'none' }}>
        <span className="eyebrow">{t('up.eyebrow')}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>{t('up.title')}</h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '50ch' }}>{t('up.sub')}</p>
      </div>

      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files[0]?.name ?? 'song.mp3'); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.flac,audio/*"
          hidden
          onChange={() => onPick('song.mp3')}
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

function ProcessingStatus({ fileName, onDone, onCancel }: { fileName: string; onDone: () => void; onCancel: () => void }) {
  const { t } = useT();
  const [pct, setPct] = useState(0);

  const PROC_STEPS = [
    { label: t('up.p1t'), sub: t('up.p1b') },
    { label: t('up.p2t'), sub: t('up.p2b') },
    { label: t('up.p3t'), sub: t('up.p3b') },
    { label: t('up.p4t'), sub: t('up.p4b') },
  ];

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += 1.4 + Math.random() * 2.2;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setTimeout(onDone, 650);
      }
      setPct(p);
    }, 90);
    return () => clearInterval(id);
  }, [onDone]);

  const activeStep = pct >= 100 ? 3 : pct >= 65 ? 2 : pct >= 20 ? 1 : 0;

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

  function startProcess(name: string) {
    setFileName(name);
    setStage('uploading');
  }

  function onDone() {
    router.push('/instrument');
  }

  if (stage === 'error') {
    return (
      <div className="upload-wrap page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <h2 className="h2">{t('up.errT')}</h2>
        <p className="muted" style={{ marginTop: 12 }}>{t('up.errB')}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setStage('idle')}>{t('up.chooseOther')}</button>
      </div>
    );
  }

  if (stage === 'uploading') {
    return <ProcessingStatus fileName={fileName} onDone={onDone} onCancel={() => setStage('idle')} />;
  }

  return <Dropzone onPick={startProcess} />;
}
