'use client';

import { SCORE, staffPos } from '@/lib/data';

const DEMO_NOTES = [
  { x: 42, y: 64 }, { x: 74, y: 52 }, { x: 104, y: 40 }, { x: 138, y: 58 },
  { x: 176, y: 46 }, { x: 212, y: 64 }, { x: 250, y: 34 }, { x: 286, y: 52 }, { x: 322, y: 58 },
];

const STAFF_TOP = 40;
const LINE_GAP = 15;

function noteY(midi: number): number {
  const pos = staffPos(midi);
  return STAFF_TOP + (8 - pos) * (LINE_GAP / 2);
}

type MusicalStaffDemoProps = {
  playing?: boolean;
  progress?: number;
  showCursor?: boolean;
};

export function MusicalStaffDemo({ playing = false, progress = 0, showCursor = true }: MusicalStaffDemoProps) {
  const defaultNote = SCORE.notes[0];
  const cursorX = 42 + progress * 280;

  return (
    <svg viewBox="0 0 360 150" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="14"
          x2="346"
          y1={STAFF_TOP + i * LINE_GAP}
          y2={STAFF_TOP + i * LINE_GAP}
          stroke="rgba(255,255,255,0.13)"
          strokeWidth="1"
        />
      ))}
      <text x="20" y="74" fontFamily="Georgia, serif" fontSize="40" fill="#cfcfcf" opacity="0.85">𝄞</text>

      {DEMO_NOTES.map((n) => (
        <g key={n.x}>
          <ellipse cx={n.x} cy={n.y} rx="6.4" ry="4.8" fill="#cfcfcf" transform={`rotate(-18 ${n.x} ${n.y})`} />
          <line x1={n.x + 6} x2={n.x + 6} y1={n.y} y2={n.y - 26} stroke="#cfcfcf" strokeWidth="1.4" />
        </g>
      ))}

      {defaultNote && (
        <g>
          <ellipse
            cx="42"
            cy={noteY(defaultNote.midi)}
            rx="7"
            ry="5.2"
            fill="rgb(204, 249, 255)"
            transform={`rotate(-18 42 ${noteY(defaultNote.midi)})`}
          />
          <line
            x1="48"
            x2="48"
            y1={noteY(defaultNote.midi)}
            y2={noteY(defaultNote.midi) - 28}
            stroke="rgb(204, 249, 255)"
            strokeWidth="1.6"
          />
        </g>
      )}

      {showCursor && (
        <line
          x1={playing ? cursorX : 150}
          x2={playing ? cursorX : 150}
          y1="24"
          y2="126"
          stroke="rgb(142, 173, 210)"
          strokeWidth="2"
          opacity={playing ? 1 : 0.85}
        />
      )}
      {!playing && showCursor && (
        <circle cx="150" cy="24" r="4" fill="rgb(204, 249, 255)" />
      )}
    </svg>
  );
}
