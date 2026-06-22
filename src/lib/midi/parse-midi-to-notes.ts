import { Midi } from '@tonejs/midi';
import { midiToTab, staffPos, type InstrumentKey, type ScoreNote } from '@/lib/data';

const BASS_TUNING = [43, 38, 33, 28];
const MAX_MIDI_BYTES = 2 * 1024 * 1024;

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

  for (const track of midi.tracks) {
    for (const note of track.notes) {
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
