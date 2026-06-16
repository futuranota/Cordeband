'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { IconUpload, IconCheck, IconSpin, IconSpark } from '@/components/ui/icons';

type Stage = 'idle' | 'uploading' | 'p1' | 'p2' | 'p3' | 'p4' | 'error';

const STEPS = ['p1', 'p2', 'p3', 'p4'] as const;

export function UploadScreen() {
  const { t } = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [dragging, setDragging] = useState(false);

  function simulateProcess() {
    setStage('uploading');
    const steps: Stage[] = ['p1', 'p2', 'p3', 'p4'];
    let i = 0;
    const next = () => {
      setStage(steps[i]);
      i++;
      if (i < steps.length) setTimeout(next, 1400);
      else setTimeout(() => router.push('/instrument'), 1000);
    };
    setTimeout(next, 600);
  }

  function handleFile(file: File) {
    if (!file) return;
    const ok = file.size <= 50 * 1024 * 1024 && /\.(mp3|wav|flac)$/i.test(file.name);
    if (!ok) { setStage('error'); return; }
    simulateProcess();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const stepIndex = STEPS.indexOf(stage as typeof STEPS[number]);

  return (
    <div className="wrap page" style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 640 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>{t('up.eyebrow')}</p>
      <h1 className="h2" style={{ marginBottom: 10 }}>{t('up.title')}</h1>
      <p className="lead" style={{ fontSize: 15, marginBottom: 36 }}>{t('up.sub')}</p>

      {stage === 'idle' || stage === 'error' ? (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            style={{
              border: `2px dashed ${dragging ? 'var(--acc)' : 'var(--line-2)'}`,
              borderRadius: 'var(--radius)',
              padding: '56px 32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--acc-soft)' : 'var(--elev)',
              transition: 'all .15s ease',
            }}
          >
            <div style={{ color: 'var(--acc)', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <IconUpload size={36} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>{t('up.drop')}</p>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('up.click')}</p>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,.flac"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {stage === 'error' && (
            <div className="card" style={{ padding: 20, marginTop: 16, borderColor: '#ef4444' }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{t('up.errT')}</p>
              <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t('up.errB')}</p>
            </div>
          )}

          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>{t('up.suggestT')}</p>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('up.suggestB')}</p>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 32 }}>
          {stage === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: 'var(--acc)' }}>
                <IconSpin size={32} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ fontWeight: 700 }}>{t('up.uploading')}</p>
            </div>
          )}

          {stepIndex >= 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STEPS.map((s, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <div key={s} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', opacity: i > stepIndex ? 0.35 : 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                      background: done ? 'var(--acc)' : active ? 'var(--acc-soft)' : 'var(--elev-2)',
                      border: `1px solid ${done || active ? 'var(--acc-line)' : 'var(--line)'}`,
                      display: 'grid', placeItems: 'center',
                      color: done ? 'var(--acc-ink)' : 'var(--acc)',
                    }}>
                      {done ? <IconCheck size={14} /> : active ? <IconSpark size={14} /> : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{i + 1}</span>}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{t(`up.${s}t`)}</p>
                      <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{t(`up.${s}b`)}</p>
                    </div>
                  </div>
                );
              })}
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{t('up.takes')}</p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
