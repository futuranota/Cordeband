import type { InstrumentKey } from '@/lib/data';
import type { StemKey, StudioFlowStepId, StudioStep } from '@/types/studio';

export const SUNO_URL = 'https://suno.com';

export const STUDIO_GUIDE_COLLAPSED_LS = 'cordeband_studio_guide_collapsed';
export const STUDIO_INSTRUMENTS_SS = 'cordeband_studio_instruments';

export const STUDIO_FLOW_STEPS: { id: StudioFlowStepId; mediaSlot: 'video' | 'image' }[] = [
  { id: 'intro', mediaSlot: 'video' },
  { id: 'genre', mediaSlot: 'image' },
  { id: 'instrument', mediaSlot: 'image' },
  { id: 'compose', mediaSlot: 'video' },
  { id: 'suno', mediaSlot: 'image' },
  { id: 'upload', mediaSlot: 'video' },
  { id: 'practice', mediaSlot: 'image' },
];

export function studioStepToFlowId(step: StudioStep): StudioFlowStepId {
  if (step === 0) return 'intro';
  if (step === 1) return 'genre';
  if (step === 2) return 'instrument';
  if (step === 3) return 'compose';
  if (step === 4) return 'suno';
  if (step === 5) return 'upload';
  return 'intro';
}

export function stemKeysToInstrumentKeys(stems: StemKey[]): InstrumentKey[] {
  return stems as InstrumentKey[];
}

export function saveStudioInstrumentsForUpload(stems: StemKey[]): void {
  if (typeof window === 'undefined') return;
  const instruments = stemKeysToInstrumentKeys(stems);
  if (instruments.length) {
    sessionStorage.setItem(STUDIO_INSTRUMENTS_SS, JSON.stringify(instruments));
  }
}

export function readStudioInstrumentsForUpload(): InstrumentKey[] | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STUDIO_INSTRUMENTS_SS);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((k): k is InstrumentKey =>
      k === 'guitar' || k === 'piano' || k === 'bass' || k === 'drums',
    );
  } catch {
    return null;
  }
}

export function clearStudioInstrumentsForUpload(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STUDIO_INSTRUMENTS_SS);
}
