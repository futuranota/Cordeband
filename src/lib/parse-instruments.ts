import { CATALOG_INSTRUMENTS } from '@/types/catalog';
import type { InstrumentKey } from '@/lib/data';

const ALLOWED = new Set<string>(CATALOG_INSTRUMENTS);

/** Normalize DB / API instrument values (array, JSON string, or comma-separated). */
export function normalizeInstrumentKeys(raw: unknown): InstrumentKey[] {
  let values: unknown[] = [];

  if (Array.isArray(raw)) {
    values = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      values = Array.isArray(parsed) ? parsed : trimmed.split(',');
    } catch {
      values = trimmed.split(',');
    }
  } else {
    return [];
  }

  const unique: InstrumentKey[] = [];
  for (const item of values) {
    if (typeof item !== 'string') continue;
    const key = item.trim();
    if (!ALLOWED.has(key)) continue;
    const inst = key as InstrumentKey;
    if (!unique.includes(inst)) unique.push(inst);
  }
  return unique;
}

export function parseInstrumentsField(raw: FormDataEntryValue | null): InstrumentKey[] | null {
  if (raw == null) return null;

  let values: string[];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) return null;
      values = parsed.map(String);
    } catch {
      values = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  } else {
    return null;
  }

  const normalized = normalizeInstrumentKeys(values);
  if (normalized.length !== values.length) return null;
  return normalized;
}

export function parseInstrumentsFromForm(form: FormData): InstrumentKey[] | null {
  const entries = form.getAll('instruments');
  if (entries.length === 0) {
    return parseInstrumentsField(form.get('instruments'));
  }

  const allowed = new Set<string>(CATALOG_INSTRUMENTS);
  const unique: InstrumentKey[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'string') return null;
    const key = entry.trim();
    if (!allowed.has(key)) return null;
    const inst = key as InstrumentKey;
    if (!unique.includes(inst)) unique.push(inst);
  }
  return unique;
}
