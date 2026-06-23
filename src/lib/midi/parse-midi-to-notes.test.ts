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

  it('auto-selects single track when only one exists', () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 50, time: 0, duration: 0.5 });

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'guitar');

    expect(notes.length).toBe(1);
    expect(notes[0].midi).toBe(50);
  });

  it('selects canonical guitar channel from multiple tracks', () => {
    const midi = new Midi();

    // Track 0: Empty
    const track0 = midi.addTrack();

    // Track 2 (canonical for guitar): Has guitar notes in correct range
    const track2 = midi.addTrack();
    const trackG = midi.addTrack();
    trackG.addNote({ midi: 60, time: 0, duration: 0.5 }); // C4
    trackG.addNote({ midi: 62, time: 1, duration: 0.5 }); // D4

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'guitar');

    // Should select track 2 (canonical) with the guitar notes
    expect(notes.length).toBe(2);
    expect(notes[0].midi).toBe(60);
    expect(notes[1].midi).toBe(62);
  });

  it('selects best-matching track when canonical is unavailable', () => {
    const midi = new Midi();

    // Track 0: Empty
    const track0 = midi.addTrack();

    // Track 1: Bass range notes (better for guitar than vocals)
    const track1 = midi.addTrack();
    track1.addNote({ midi: 50, time: 0, duration: 0.5 });
    track1.addNote({ midi: 52, time: 1, duration: 0.5 });

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'guitar');

    // Should use track 1 since it's the only one with notes
    expect(notes.length).toBe(2);
  });

  it('handles bass instrument with bass range detection', () => {
    const midi = new Midi();

    // Add bass notes in correct range (Mi1 to Mi3, MIDI 28-52)
    const track = midi.addTrack();
    track.addNote({ midi: 40, time: 0, duration: 0.5 }); // E2
    track.addNote({ midi: 45, time: 1, duration: 0.5 }); // A2

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'bass');

    expect(notes.length).toBe(2);
    expect(notes[0].midi).toBe(40);
    expect(notes[1].midi).toBe(45);
  });

  it('returns empty notes when MIDI has no tracks with notes', () => {
    const midi = new Midi();
    const track = midi.addTrack();
    // No notes added

    const buffer = midi.toArray().buffer as ArrayBuffer;
    const notes = parseMidiBufferToScoreNotes(buffer, 120, 'guitar');

    expect(notes.length).toBe(0);
  });

  it('validates file extension', () => {
    expect(validateMidiUpload({ name: 'part.mid', size: 100 })).toBeNull();
    expect(validateMidiUpload({ name: 'part.mp3', size: 100 })).toMatch(/Unsupported/);
  });
});
