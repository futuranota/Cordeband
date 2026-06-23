'use client';

import { useState } from 'react';
import { useT } from '@/i18n/context';
import { UploadScreen } from './UploadScreen';
import { MidiPreviewScreen } from './MidiPreviewScreen';
import type { InstrumentKey } from '@/lib/data';
import { IconUpload } from '@/components/ui/icons';

type Mode = 'select' | 'preview' | 'full-upload';

type UploadModeProps = {
  fromStudio?: boolean;
};

export function UploadModeSelector({ fromStudio }: UploadModeProps) {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('select');
  const [previewData, setPreviewData] = useState<{
    midiBuffer: ArrayBuffer;
    instrument: InstrumentKey;
    selectedChannel: number | null;
  } | null>(null);

  if (mode === 'preview') {
    return (
      <MidiPreviewScreen
        onPreviewReady={(midiBuffer, instrument, selectedChannel) => {
          setPreviewData({ midiBuffer, instrument, selectedChannel });
          // TODO: Navigate to preview panel with MIDI data
          console.log('Preview ready:', { midiBuffer, instrument, selectedChannel });
        }}
        onCancel={() => setMode('select')}
      />
    );
  }

  if (mode === 'full-upload') {
    return <UploadScreen />;
  }

  // Mode selector
  return (
    <div className="upload-wrap page">
      <div className="section-head" style={{ textAlign: 'center', margin: '0 auto 48px', maxWidth: 'none' }}>
        <span className="eyebrow">{t('up.eyebrow')}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>
          Upload Mode
        </h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '50ch' }}>
          Choose how you want to proceed
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Preview Mode */}
        <div className="card" style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }} onClick={() => setMode('preview')}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>MIDI Preview</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Load a MIDI file and preview channels. Perfect for testing and understanding how the auto-detection works.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--acc)', marginBottom: 24 }}>
            <div>✓ Fast (no server processing)</div>
            <div>✓ No credit usage</div>
            <div>✓ Test channel detection</div>
          </div>
          <button type="button" className="btn btn-primary">
            Start Preview
          </button>
        </div>

        {/* Full Upload Mode */}
        <div className="card" style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }} onClick={() => setMode('full-upload')}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎵</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Full Upload</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Upload audio + MIDI for complete processing. Generate AI scores, stems, and full analysis.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--acc)', marginBottom: 24 }}>
            <div>✓ Full processing</div>
            <div>✓ AI score generation</div>
            <div>✓ Stem separation</div>
          </div>
          <button type="button" className="btn btn-primary">
            <IconUpload size={16} /> Full Upload
          </button>
        </div>
      </div>
    </div>
  );
}
