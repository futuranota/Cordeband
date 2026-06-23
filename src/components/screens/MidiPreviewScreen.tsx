'use client';

import { useState, useRef } from 'react';
import { useT } from '@/i18n/context';
import { MidiChannelSelector } from '@/components/instruments/MidiChannelSelector';
import { useMidiChannelDetection } from '@/hooks/useMidiChannelDetection';
import type { InstrumentKey } from '@/lib/data';
import { INSTRUMENTS, INST_ORDER } from '@/lib/data';
import { IconUpload, IconCheck, IconSpin } from '@/components/ui/icons';

type Props = {
  onPreviewReady: (midiBuffer: ArrayBuffer, instrument: InstrumentKey, selectedChannel: number | null) => void;
  onCancel: () => void;
};

export function MidiPreviewScreen({ onPreviewReady, onCancel }: Props) {
  const { t } = useT();
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentKey>('guitar');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { detection, selectedChannel, setSelectedChannel, detectChannels, isLoading: isDetecting } = useMidiChannelDetection();

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.name.match(/\.midi?$/i)) {
      setError(t('up.midiFormat'));
      return;
    }
    setMidiFile(file);
    void detectChannels(file, selectedInstrument);
  }

  async function handleRead() {
    if (!midiFile) {
      setError('MIDI file is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await midiFile.arrayBuffer();
      onPreviewReady(buffer, selectedInstrument, selectedChannel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read MIDI file');
      setIsLoading(false);
    }
  }

  function handleInstrumentChange(inst: InstrumentKey) {
    setSelectedInstrument(inst);
    if (midiFile) {
      void detectChannels(midiFile, inst);
    }
  }

  return (
    <div className="upload-wrap page">
      <div className="section-head" style={{ textAlign: 'center', margin: '0 auto 34px', maxWidth: 'none' }}>
        <span className="eyebrow">{t('up.eyebrow')}</span>
        <h1 className="h1" style={{ fontSize: 'clamp(32px,4vw,46px)', marginTop: 14 }}>
          MIDI Preview
        </h1>
        <p className="lead" style={{ margin: '16px auto 0', maxWidth: '50ch' }}>
          Load a MIDI file to preview channels and test the auto-detection
        </p>
      </div>

      {/* Instrument Selector */}
      <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        <label className="field-label">Select Instrument</label>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>Choose which instrument you'll be playing</p>
        <div className="instrument-picker-grid" role="group">
          {INST_ORDER.map((k) => {
            const Icon = INSTRUMENTS[k].Icon;
            const on = selectedInstrument === k;
            return (
              <div key={k} className={`instrument-picker-item${on ? ' on' : ''}`}>
                <button
                  type="button"
                  className={`detected-inst-chip instrument-picker-chip${on ? ' on' : ''}`}
                  aria-pressed={on}
                  onClick={() => handleInstrumentChange(k)}
                >
                  <Icon size={18} sw={1.5} />
                  <span className="instrument-picker-item-label">{t(`inst.${k}`)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDI File Upload */}
      <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        <label className="field-label">MIDI File</label>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>Upload a MIDI file to preview</p>
        {midiFile ? (
          <div className="row spread">
            <span style={{ fontSize: 13.5 }}>📄 {midiFile.name}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setMidiFile(null);
                setSelectedChannel(null);
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => inputRef.current?.click()}
          >
            <IconUpload size={14} /> Upload MIDI
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".mid,.midi,audio/midi"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, margin: '10px 0 0' }}>{error}</p>
        )}
      </div>

      {/* Channel Selector */}
      {detection && (
        <MidiChannelSelector
          detection={detection}
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
          disabled={isLoading}
        />
      )}

      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!midiFile || isLoading || isDetecting}
          onClick={handleRead}
        >
          {isLoading ? (
            <>
              <IconSpin size={16} className="spin" /> Loading...
            </>
          ) : (
            <>
              <IconCheck size={16} /> Read MIDI
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-lg"
          style={{ marginLeft: 12 }}
          disabled={isLoading}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 13 }}>
        This mode processes locally in your browser. No data is sent to servers.
      </p>
    </div>
  );
}
