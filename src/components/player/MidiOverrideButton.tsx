'use client';

import { useRef, useState } from 'react';
import { IconUpload, IconSpin } from '@/components/ui/icons';
import { useT } from '@/i18n/context';
import { hasAcceptedMidiUploadTerms } from '@/lib/midi-upload-terms';
import { MidiUploadTermsDialog } from '@/components/player/MidiUploadTermsDialog';
import type { InstrumentKey } from '@/lib/data';

type Props = {
  songId: string;
  instrument: InstrumentKey;
  isUserMidi: boolean;
  onUploaded: () => void;
};

export function MidiOverrideButton({ songId, instrument, isUserMidi, onUploaded }: Props) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openPicker() {
    setError(null);
    if (hasAcceptedMidiUploadTerms()) {
      inputRef.current?.click();
    } else {
      setTermsOpen(true);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.match(/\.midi?$/i)) {
      setError(t('up.midiFormat'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('instrument', instrument);
      const res = await fetch(`/api/songs/${songId}/midi`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? t('up.midiUploadFailed'));
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('up.midiUploadFailed'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="midi-override">
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={openPicker}>
        {busy ? <IconSpin size={14} className="spin" /> : <IconUpload size={14} />}{' '}
        {isUserMidi ? t('player.midiReplace') : t('player.midiAttach')}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi,audio/midi"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && (
        <p style={{ color: '#ef4444', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
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
  );
}
