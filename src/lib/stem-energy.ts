/**
 * RMS energy gate for Demucs stems — keeps only instruments with audible content.
 * Used by the Railway audio processor after separation.
 */

const DEFAULT_RMS_THRESHOLD = 0.008;

export function computeWavRms(pcm: Float32Array | Int16Array): number {
  if (!pcm.length) return 0;

  let sumSq = 0;
  if (pcm instanceof Int16Array) {
    for (let i = 0; i < pcm.length; i++) {
      const sample = pcm[i] / 32768;
      sumSq += sample * sample;
    }
  } else {
    for (let i = 0; i < pcm.length; i++) {
      const sample = pcm[i];
      sumSq += sample * sample;
    }
  }
  return Math.sqrt(sumSq / pcm.length);
}

export function filterInstrumentsByEnergy(
  energies: Record<string, number>,
  threshold = DEFAULT_RMS_THRESHOLD,
): string[] {
  return Object.entries(energies)
    .filter(([, rms]) => rms >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([instrument]) => instrument);
}

export { DEFAULT_RMS_THRESHOLD };
