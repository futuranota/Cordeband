import { createClient } from '@/lib/supabase/client';
import { SCORE, staffPos, midiToTab, type InstrumentKey, type ScoreNote } from '@/lib/data';

export type SongScore = {
  notes: ScoreNote[];
  totalBeats: number;
  fromDb: boolean;
};

function asScoreNote(raw: unknown): ScoreNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const beat = Number(n.beat);
  const dur = Number(n.dur);
  const midi = Number(n.midi);
  if (!Number.isFinite(beat) || !Number.isFinite(dur) || !Number.isFinite(midi)) return null;

  const tabRaw = n.tab as { string?: number; fret?: number } | undefined;
  const tab = tabRaw && Number.isFinite(tabRaw.string) && Number.isFinite(tabRaw.fret)
    ? { string: tabRaw.string!, fret: tabRaw.fret! }
    : midiToTab(midi);

  const s = Number.isFinite(n.s) ? Number(n.s) : staffPos(midi);

  return { beat, dur, midi, s, tab };
}

export function buildScoreFromNotes(rawNotes: unknown): SongScore {
  if (!Array.isArray(rawNotes) || rawNotes.length === 0) {
    return { notes: SCORE.notes, totalBeats: SCORE.totalBeats, fromDb: false };
  }

  const notes = rawNotes
    .map(asScoreNote)
    .filter((n): n is ScoreNote => n != null)
    .sort((a, b) => a.beat - b.beat);

  if (!notes.length) {
    return { notes: SCORE.notes, totalBeats: SCORE.totalBeats, fromDb: false };
  }

  const totalBeats = notes.reduce((max, n) => Math.max(max, n.beat + n.dur), 0);
  return { notes, totalBeats: Math.max(totalBeats, 1), fromDb: true };
}

export async function fetchSongScore(
  songId: string,
  instrument: InstrumentKey,
): Promise<SongScore> {
  const supabase = createClient();

  async function loadFor(inst: InstrumentKey) {
    const { data } = await supabase
      .from('note_sequences')
      .select('notes')
      .eq('song_id', songId)
      .eq('instrument_type', inst)
      .maybeSingle();
    return data?.notes ?? null;
  }

  let raw = await loadFor(instrument);
  if (!raw && instrument !== 'guitar') {
    raw = await loadFor('guitar');
  }

  return buildScoreFromNotes(raw);
}
