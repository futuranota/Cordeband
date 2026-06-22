'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useT } from '@/i18n/context';
import { acceptMidiUploadTerms, MIDI_UPLOAD_TERMS_PATH } from '@/lib/midi-upload-terms';
import { IconUpload } from '@/components/ui/icons';

type Props = {
  open: boolean;
  onCancel: () => void;
  onAccepted: () => void;
};

export function MidiUploadTermsDialog({ open, onCancel, onAccepted }: Props) {
  const { t } = useT();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) setChecked(false);
  }, [open]);

  function handleConfirm() {
    if (!checked) return;
    acceptMidiUploadTerms();
    onAccepted();
  }

  return (
    <ConfirmDialog
      open={open}
      title={t('midiTerms.dialogTitle')}
      message={t('midiTerms.dialogIntro')}
      confirmLabel={t('midiTerms.continue')}
      cancelLabel={t('midiTerms.cancel')}
      confirmDisabled={!checked}
      icon={<IconUpload size={24} />}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    >
      <label className="midi-terms-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>
          {t('midiTerms.checkboxPrefix')}{' '}
          <Link href={MIDI_UPLOAD_TERMS_PATH} target="_blank" rel="noopener noreferrer" className="cb-link">
            {t('midiTerms.link')}
          </Link>
        </span>
      </label>
    </ConfirmDialog>
  );
}
