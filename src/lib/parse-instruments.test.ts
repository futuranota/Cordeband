import { describe, expect, it } from 'vitest';
import { computeWavRms, filterInstrumentsByEnergy } from '@/lib/stem-energy';
import { parseInstrumentsFromForm } from '@/lib/parse-instruments';

describe('parseInstrumentsFromForm', () => {
  it('reads repeated form fields', () => {
    const form = new FormData();
    form.append('instruments', 'piano');
    form.append('instruments', 'guitar');
    expect(parseInstrumentsFromForm(form)).toEqual(['piano', 'guitar']);
  });

  it('rejects unknown instruments', () => {
    const form = new FormData();
    form.set('instruments', 'piano,flute');
    expect(parseInstrumentsFromForm(form)).toBeNull();
  });
});

describe('stem-energy', () => {
  it('filters quiet stems', () => {
    const kept = filterInstrumentsByEnergy({
      piano: 0.12,
      guitar: 0.001,
      drums: 0.05,
    });
    expect(kept).toEqual(['piano', 'drums']);
  });

  it('returns zero RMS for silence', () => {
    expect(computeWavRms(new Float32Array(1000))).toBe(0);
  });
});
