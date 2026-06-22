import { describe, expect, it } from 'vitest';
import { Midi } from '@tonejs/midi';
import { parseMidiBufferToScoreNotes, validateMidiUpload } from '@/lib/midi/parse-midi-to-notes';

describe('parseMidiBufferToScoreNotes', () => {
  it('parses notes from a generated MIDI buffer', () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 64, time: 0, duration: 0.5 });
    track.addNote({ midi: 67, time: 1, duration: 0.25 });

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'guitar');

    expect(notes.length).toBe(2);
    expect(notes[0].midi).toBe(64);
    expect(notes[0].source).toBe('user_upload');
    expect(notes[0].startTime).toBe(0);
    expect(notes[0].confidence).toBe(1);
    expect(notes[1].midi).toBe(67);
  });

  it('validates file extension', () => {
    expect(validateMidiUpload({ name: 'part.mid', size: 100 })).toBeNull();
    expect(validateMidiUpload({ name: 'part.mp3', size: 100 })).toMatch(/Unsupported/);
  });
});
