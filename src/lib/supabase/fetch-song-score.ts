import { createClient } from '@/lib/supabase/client';
import { midiDurationFromNotes } from '@/lib/midi/score-sync';
import { staffPos, midiToTab, type InstrumentKey, type ScoreNote } from '@/lib/data';

export type SongScore = {
  notes: ScoreNote[];
  totalBeats: number;
  fromDb: boolean;
  source?: string | null;
  midiDurationSec?: number | null;
};

function asScoreNote(raw: unknown, bpm = 120): ScoreNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;

  let beat = Number(n.beat);
  let dur = Number(n.dur);
  let midi = Number(n.midi);

  if (!Number.isFinite(beat) && Number.isFinite(n.startTime)) {
    beat = (Number(n.startTime) * bpm) / 60;
  }
  if (!Number.isFinite(dur) && Number.isFinite(n.duration)) {
    dur = (Number(n.duration) * bpm) / 60;
  }
  if (!Number.isFinite(midi) && Number.isFinite(n.pitch)) {
    midi = Number(n.pitch);
  }

  if (!Number.isFinite(beat) || !Number.isFinite(dur) || !Number.isFinite(midi)) return null;

  const tabRaw = n.tab as { string?: number; fret?: number } | undefined;
  const tab = tabRaw && Number.isFinite(tabRaw.string) && Number.isFinite(tabRaw.fret)
    ? { string: tabRaw.string!, fret: tabRaw.fret! }
    : midiToTab(midi);

  const s = Number.isFinite(n.s) ? Number(n.s) : staffPos(midi);

  const startTime = Number.isFinite(n.startTime) ? Number(n.startTime) : null;
  const endTime = Number.isFinite(n.endTime) ? Number(n.endTime) : null;
  const confidence = Number.isFinite(n.confidence) ? Number(n.confidence) : null;
  const source = typeof n.source === 'string' ? n.source : null;
  const qualityRaw = n.quality;
  const quality =
    qualityRaw === 'high' || qualityRaw === 'medium' || qualityRaw === 'draft' || qualityRaw === 'unavailable'
      ? qualityRaw
      : null;

  return {
    beat,
    dur,
    midi,
    s,
    tab,
    startTime,
    endTime,
    confidence,
    source,
    quality,
  };
}

export function buildScoreFromNotes(rawNotes: unknown, bpm = 120, source?: string | null): SongScore {
  if (!Array.isArray(rawNotes) || rawNotes.length === 0) {
    return { notes: [], totalBeats: 0, fromDb: false, source: source ?? null, midiDurationSec: null };
  }

  const notes = rawNotes
    .map((n) => asScoreNote(n, bpm))
    .filter((n): n is ScoreNote => n != null)
    .sort((a, b) => a.beat - b.beat);

  if (!notes.length) {
    return { notes: [], totalBeats: 0, fromDb: false, source: source ?? null, midiDurationSec: null };
  }

  const resolvedSource = source ?? notes.find((n) => n.source)?.source ?? null;
  const totalBeats = notes.reduce((max, n) => Math.max(max, n.beat + n.dur), 0);
  const midiDurationSec = resolvedSource === 'user_upload' ? midiDurationFromNotes(notes, bpm) : null;

  return {
    notes,
    totalBeats: Math.max(totalBeats, 1),
    fromDb: true,
    source: resolvedSource,
    midiDurationSec,
  };
}

export async function fetchSongScore(
  songId: string,
  instrument: InstrumentKey,
  bpm = 120,
): Promise<SongScore> {
  const supabase = createClient();

  async function loadFor(inst: InstrumentKey) {
    const { data } = await supabase
      .from('note_sequences')
      .select('notes, source')
      .eq('song_id', songId)
      .eq('instrument_type', inst)
      .maybeSingle();
    return data ?? null;
  }

  let row = await loadFor(instrument);
  if (!row && instrument !== 'guitar') {
    row = await loadFor('guitar');
  }

  return buildScoreFromNotes(row?.notes ?? null, bpm, row?.source ?? null);
}

/** Fetch transcribed notes for several instruments of the same song in one query. */
export async function fetchAllSongScores(
  songId: string,
  instruments: readonly InstrumentKey[],
  bpm = 120,
): Promise<Partial<Record<InstrumentKey, SongScore>>> {
  if (!instruments.length) return {};
  const supabase = createClient();

  const { data } = await supabase
    .from('note_sequences')
    .select('instrument_type, notes, source')
    .eq('song_id', songId)
    .in('instrument_type', instruments as InstrumentKey[]);

  const out: Partial<Record<InstrumentKey, SongScore>> = {};
  for (const row of data ?? []) {
    const inst = row.instrument_type as InstrumentKey;
    out[inst] = buildScoreFromNotes(row.notes, bpm, row.source);
  }
  return out;
}
