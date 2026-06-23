import { Midi } from '@tonejs/midi';
import { midiToTab, staffPos, type InstrumentKey, type ScoreNote } from '@/lib/data';

const BASS_TUNING = [43, 38, 33, 28];
const MAX_MIDI_BYTES = 2 * 1024 * 1024;

// MIDI note range for each instrument (General MIDI / typical usage)
const INSTRUMENT_RANGES: Record<InstrumentKey, { min: number; max: number }> = {
  vocals: { min: 48, max: 84 },   // Do3 a Do5
  guitar: { min: 40, max: 84 },   // Mi2 a Do5
  piano: { min: 21, max: 108 },   // La0 a Do8
  bass: { min: 28, max: 52 },     // Mi1 a Mi3
  drums: { min: 35, max: 81 },    // Standard drum range
  other: { min: 0, max: 127 },    // Full range
};

// Canonical MIDI channels (General MIDI standard)
const CANONICAL_CHANNELS: Record<InstrumentKey, number | null> = {
  vocals: 0,  // Track 0 (channel 1)
  guitar: 2,  // Track 2 (channel 3)
  piano: 0,   // Track 0 (channel 1)
  bass: 1,    // Track 1 (channel 2)
  drums: 9,   // Track 9 (channel 10 - drums)
  other: null,
};

interface ChannelMetrics {
  min: number;
  max: number;
  noteCount: number;
  density: number;
  range: number;
}

function analyzeChannelMetrics(track: any): ChannelMetrics {
  if (!track.notes || track.notes.length === 0) {
    return { min: 0, max: 0, noteCount: 0, density: 0, range: 0 };
  }

  const min = Math.min(...track.notes.map((n: any) => n.midi));
  const max = Math.max(...track.notes.map((n: any) => n.midi));
  const noteCount = track.notes.length;

  const startTime = Math.min(...track.notes.map((n: any) => n.time));
  const endTime = Math.max(...track.notes.map((n: any) => n.time + n.duration));
  const duration = Math.max(endTime - startTime, 0.001);
  const density = noteCount / duration;

  return {
    min,
    max,
    noteCount,
    density,
    range: max - min,
  };
}

function selectBestChannel(midi: any, instrument: InstrumentKey): any | null {
  const tracks = midi.tracks.filter((t: any) => t.notes && t.notes.length > 0);

  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];

  // Step 1: Try canonical channel
  const canonicalChannel = CANONICAL_CHANNELS[instrument];
  if (canonicalChannel !== null && canonicalChannel < midi.tracks.length) {
    const canonicalTrack = midi.tracks[canonicalChannel];
    if (canonicalTrack && canonicalTrack.notes && canonicalTrack.notes.length > 0) {
      return canonicalTrack;
    }
  }

  // Step 2: Find best match by heuristics
  const instrumentRange = INSTRUMENT_RANGES[instrument];
  let bestTrack = null;
  let bestScore = -Infinity;

  for (const track of tracks) {
    const metrics = analyzeChannelMetrics(track);
    let score = 0;

    // Score: notes within expected range
    const minInRange = metrics.min >= instrumentRange.min;
    const maxInRange = metrics.max <= instrumentRange.max;
    if (minInRange && maxInRange) {
      score += 100;
    } else if (minInRange || maxInRange) {
      score += 50;
    }

    // Score: reasonable note density (not too sparse, not too dense)
    if (metrics.density > 0.5 && metrics.density < 10) {
      score += 30;
    }

    // Score: note count (prefer tracks with content)
    score += Math.min(metrics.noteCount / 100, 20);

    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestTrack || tracks[0];
}

function midiToBassTab(midi: number): { string: number; fret: number } {
  let best: { string: number; fret: number } | null = null;
  for (let s = 0; s < BASS_TUNING.length; s++) {
    const fret = midi - BASS_TUNING[s];
    if (fret < 0 || fret > 24) continue;
    if (!best || fret < best.fret) best = { string: s, fret };
  }
  return best ?? { string: 0, fret: Math.max(0, midi - BASS_TUNING[3]) };
}

export function isMidiFileName(name: string): boolean {
  return /\.midi?$/i.test(name.trim());
}

export function parseMidiBufferToScoreNotes(
  buffer: ArrayBuffer,
  bpm: number,
  instrument: InstrumentKey,
): ScoreNote[] {
  if (buffer.byteLength > MAX_MIDI_BYTES) {
    throw new Error('MIDI file exceeds 2 MB limit');
  }

  const midi = new Midi(buffer);
  const notes: ScoreNote[] = [];

  // Auto-detect the best channel for the selected instrument
  const selectedTrack = selectBestChannel(midi, instrument);
  if (!selectedTrack || !selectedTrack.notes || selectedTrack.notes.length === 0) {
    return notes;
  }

  for (const note of selectedTrack.notes) {
    const startTime = Math.max(0, note.time);
    const endTime = Math.max(startTime + 0.05, note.time + note.duration);
    const durationSec = endTime - startTime;
    const beat = (startTime * bpm) / 60;
    const dur = (durationSec * bpm) / 60;
    const pitch = Math.round(note.midi);

    const scoreNote: ScoreNote = {
      beat: round4(beat),
      dur: round4(Math.max(dur, 0.05)),
      midi: pitch,
      s: staffPos(pitch),
      tab: instrument === 'bass' ? midiToBassTab(pitch) : midiToTab(pitch),
      startTime: round4(startTime),
      endTime: round4(endTime),
      confidence: 1,
      source: 'user_upload',
      quality: 'high',
    };
    notes.push(scoreNote);
  }

  notes.sort((a, b) => a.beat - b.beat);
  return notes;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function validateMidiUpload(file: { name: string; size: number }): string | null {
  if (!file.name.trim()) return 'MIDI file is required';
  if (file.size <= 0) return 'MIDI file is required';
  if (file.size > MAX_MIDI_BYTES) return 'MIDI file exceeds 2 MB limit';
  if (!isMidiFileName(file.name)) return 'Unsupported file — use .mid or .midi';
  return null;
}
