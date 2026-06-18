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

function escapeTex(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
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

function noteToken(note: ScoreNote, inst: InstrumentKey): string {
  if (isTabInstrument(inst)) {
    return `${note.tab.string + 1}.${note.tab.fret}`;
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
    '.',
    `\\track "${instrument}" instrument ${INST_PROGRAM[instrument]}`,
  ];

  if (isTabInstrument(instrument)) {
    header.push('\\staff {tabs standard}');
    header.push(instrument === 'guitar'
      ? '\\tuning (E2 A2 D3 G3 B3 E4)'
      : '\\tuning (E1 A1 D2 G2)');
  } else {
    header.push('\\staff');
  }

  const bars: string[] = [];
  for (let i = 0; i < barCount; i++) {
    const barStart = i * 4;
    const barEnd = barStart + 4;
    bars.push(`${buildMeasureContent(sorted, instrument, barStart, barEnd)} |`);
  }

  return `${header.join('\n')}\n${bars.join('\n')}`;
}
