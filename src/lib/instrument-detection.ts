export type InstrumentDetectionMode = 'manual' | 'auto';

export function getInstrumentDetectionMode(): InstrumentDetectionMode {
  return process.env.AUDIO_PROCESSOR_URL?.trim() ? 'auto' : 'manual';
}

export function usesAutoInstrumentDetection(): boolean {
  return getInstrumentDetectionMode() === 'auto';
}

export function instrumentBannerKeys(mode?: InstrumentDetectionMode) {
  const resolved = mode ?? getInstrumentDetectionMode();
  if (resolved === 'auto') {
    return { titleKey: 'up.detectedTitle', subKey: 'up.detectedSub' };
  }
  return { titleKey: 'up.indicatedTitle', subKey: 'up.indicatedSub' };
}

export function instrumentSelectorBannerKey(mode?: InstrumentDetectionMode): string {
  const resolved = mode ?? getInstrumentDetectionMode();
  return resolved === 'auto' ? 'sel.detectedBanner' : 'sel.indicatedBanner';
}
