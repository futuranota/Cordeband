const LS_KEY = 'cordeband_midi_terms_v1';

export function hasAcceptedMidiUploadTerms(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_KEY) === '1';
}

export function acceptMidiUploadTerms(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, '1');
}

export const MIDI_UPLOAD_TERMS_PATH = '/legal/midi-upload';
