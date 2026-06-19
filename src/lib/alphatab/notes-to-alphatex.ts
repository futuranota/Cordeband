import type { InstrumentKey, ScoreNote } from '@/lib/data';

const TICKS_PER_QUARTER = 960;

const INST_PROGRAM: Record<InstrumentKey, number> = {
  guitar: 25,
  piano: 0,
  bass: 33,
  drums: 128,
  vocals: 52,
  other: 0,
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** General MIDI percussion map → alphaTex articulation identifiers */
const GM_PERCUSSION: Record<number, string> = {
  35: 'KickHit',
  36: 'KickHit',
  38: 'SnareHit',
  40: 'SnareHit',
  42: 'HiHatClosed',
  44: 'HiHatHalf',
  46: 'HiHatOpen',
  49: 'CrashMediumHit',
  51: 'RideMiddle',
  53: 'RideBell',
  57: 'CrashHighHit',
};

function escapeTex(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

function midiToPercussion(midi: number): string {
  if (GM_PERCUSSION[midi]) return GM_PERCUSSION[midi];
  if (midi < 45) return 'KickHit';
  if (midi < 55) return 'SnareHit';
  if (midi < 65) return 'HiHatClosed';
  return 'RideMiddle';
}

function durToToken(dur: number): string {
  if (dur >= 4) return ':1';
  if (dur >= 2) return ':2';
  if (dur >= 1) return ':4';
  if (dur >= 0.5) return ':8';
  return ':16';
}

function isTabInstrument(inst: InstrumentKey): boolean {
  return inst === 'guitar' || inst === 'bass';
}

/** Guitar tuning high→low — matches \\tuning (E2 A2 D3 G3 B3 E4) string 1-6 */
const GUITAR_TUNING = [64, 59, 55, 50, 45, 40];

/** Bass tuning high→low (G2 D2 A1 E1) — matches \\tuning (E1 A1 D2 G2) string 1-4 */
const BASS_TUNING = [43, 38, 33, 28];

function midiToGuitarTab(midi: number): { string: number; fret: number } {
  let best: { string: number; fret: number } | null = null;
  for (let s = 0; s < GUITAR_TUNING.length; s++) {
    const fret = midi - GUITAR_TUNING[s];
    if (fret < 0 || fret > 24) continue;
    if (!best || fret < best.fret) best = { string: s, fret };
  }
  return best ?? { string: 0, fret: Math.max(0, midi - GUITAR_TUNING[0]) };
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

function tabToken(note: ScoreNote, inst: InstrumentKey): string {
  const tab = inst === 'bass' ? midiToBassTab(note.midi) : midiToGuitarTab(note.midi);
  const maxString = inst === 'bass' ? 4 : 6;
  const string = Math.max(1, Math.min(maxString, tab.string + 1));
  const fret = Math.max(0, Math.min(24, tab.fret));
  return `${fret}.${string}`;
}

function isPercussion(inst: InstrumentKey): boolean {
  return inst === 'drums';
}

function noteToken(note: ScoreNote, inst: InstrumentKey): string {
  if (inst === 'guitar') {
    return tabToken(note, inst);
  }
  if (inst === 'bass') {
    return tabToken(note, inst);
  }
  if (isPercussion(inst)) {
    return midiToPercussion(note.midi);
  }
  return midiToNoteName(note.midi);
}

function buildMeasureContent(
  notes: ScoreNote[],
  inst: InstrumentKey,
  barStart: number,
  barEnd: number,
): string {
  const inBar = notes.filter((n) => n.beat >= barStart && n.beat < barEnd);
  if (!inBar.length) return ':1 r';

  const parts: string[] = [];
  let cursor = barStart;

  for (const note of inBar) {
    if (note.beat > cursor) {
      parts.push(`${durToToken(note.beat - cursor)} r`);
      cursor = note.beat;
    }
    parts.push(`${durToToken(note.dur)} ${noteToken(note, inst)}`);
    cursor = note.beat + note.dur;
  }

  if (cursor < barEnd) {
    parts.push(`${durToToken(barEnd - cursor)} r`);
  }

  return parts.join(' ');
}

function buildTrackHeader(instrument: InstrumentKey): string[] {
  const trackName = escapeTex(instrument);
  if (isPercussion(instrument)) {
    return [
      `\\track "${trackName}"`,
      '\\instrument percussion',
      '\\clef neutral',
      '\\articulation defaults',
    ];
  }
  return [
    `\\track "${trackName}"`,
    `\\instrument ${INST_PROGRAM[instrument]}`,
  ];
}

export function beatToTickPosition(beat: number): number {
  return Math.round(beat * TICKS_PER_QUARTER);
}

export function notesToAlphaTex(
  title: string,
  bpm: number,
  instrument: InstrumentKey,
  notes: ScoreNote[],
): string | null {
  if (!notes.length) return null;

  const sorted = [...notes].sort((a, b) => a.beat - b.beat);
  const totalBeats = sorted.reduce((max, n) => Math.max(max, n.beat + n.dur), 4);
  const barCount = Math.max(1, Math.ceil(totalBeats / 4));

  const header = [
    `\\title "${escapeTex(title)}"`,
    `\\tempo ${Math.round(bpm)}`,
    '\\ts common',
    ...buildTrackHeader(instrument),
  ];

  if (instrument === 'guitar') {
    header.push('\\staff {score tabs}');
    header.push('\\tuning (E2 A2 D3 G3 B3 E4)');
  } else if (instrument === 'bass') {
    header.push('\\staff {score tabs}');
    header.push('\\tuning (E1 A1 D2 G2)');
  } else {
    header.push('\\staff {score}');
  }

  const bars: string[] = [];
  for (let i = 0; i < barCount; i++) {
    const barStart = i * 4;
    const barEnd = barStart + 4;
    bars.push(`${buildMeasureContent(sorted, instrument, barStart, barEnd)} |`);
  }

  return `${header.join('\n')}\n${bars.join('\n')}`;
}
