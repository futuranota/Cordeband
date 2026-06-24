'use client';

import { useEffect, useRef, useState } from 'react';
import { SCORE, type ScoreNote } from '@/lib/data';
import { IconSpark } from '@/components/ui/icons';
import { isNoteActive, isNotePlayed } from '@/lib/active-note'; // NUEVO

const PPB = 56;
const LEFT = 92;
const RIGHT = 220;
const STAFF_TOP = 78;
const GAP = 13;
const SHEET_H = 500;

const C_LINE = 'rgba(255,255,255,0.13)';
const C_LINE_2 = 'rgba(255,255,255,0.07)';
const C_NOTE = '#cfcfcf';

const xAt = (beat: number) => LEFT + beat * PPB;
const yAt = (s: number) => STAFF_TOP + ((8 - s) / 2) * GAP;

function barBeats(scoreTotal: number): number[] {
  const bars: number[] = [];
  const limit = Math.max(scoreTotal, 4);
  for (let b = 0; b <= limit; b += 4) bars.push(b);
  return bars;
}

// ── Playhead Cursor Component ────────────────────────────────────────────────

function PlayheadCursor({ cursorX }: { cursorX: number }) {
  return (
    <div className="playhead-cursor" style={{ left: `${cursorX}px` }}>
      <div className="playhead-marker" />
      <div className="playhead-line" />
    </div>
  );
}

// ── Helpers de activación — usan curTimeSec si existe, beats como fallback ──

function resolveActive(
  n: ScoreNote,
  curBeat: number,
  curTimeSec: number | undefined,
  bpm: number,
): boolean {
  if (curTimeSec != null && curTimeSec > 0) {
    return isNoteActive(n, curTimeSec, bpm); // NUEVO: usa segundos reales
  }
  // fallback: comportamiento anterior por beats
  return curBeat >= n.beat && curBeat < n.beat + n.dur;
}

function resolvePlayed(
  n: ScoreNote,
  curBeat: number,
  curTimeSec: number | undefined,
  bpm: number,
): boolean {
  if (curTimeSec != null && curTimeSec > 0) {
    return isNotePlayed(n, curTimeSec, bpm); // NUEVO: usa segundos reales
  }
  // fallback: comportamiento anterior por beats
  return n.beat + n.dur <= curBeat;
}

// ── Sub-views ────────────────────────────────────────────────────────────────

function StaffView({
  notes,
  totalWidth,
  curBeat,
  curTimeSec, // NUEVO
  bpm,        // NUEVO
  scoreTotal,
}: {
  notes: ScoreNote[];
  totalWidth: number;
  curBeat: number;
  curTimeSec?: number; // NUEVO
  bpm: number;         // NUEVO
  scoreTotal: number;
}) {
  const bars = barBeats(scoreTotal);

  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display: 'block' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={LEFT - 14} x2={totalWidth - 40} y1={STAFF_TOP + i * GAP} y2={STAFF_TOP + i * GAP} stroke={C_LINE} strokeWidth="1" />
      ))}
      {bars.map((b) => {
        const measure = Math.floor(b / 4) + 1;
        return (
          <g key={b}>
            <line x1={xAt(b)} x2={xAt(b)} y1={STAFF_TOP} y2={STAFF_TOP + 4 * GAP} stroke={C_LINE} strokeWidth="1" />
            <text x={xAt(b)} y={STAFF_TOP - 20} fontSize="10" fill="rgba(128,128,128,0.6)" textAnchor="middle">
              {measure}
            </text>
          </g>
        );
      })}
      {notes.map((n, i) => {
        const x = xAt(n.beat);
        const y = yAt(n.s);
        // NUEVO: usa curTimeSec si está disponible, beats como fallback
        const played = resolvePlayed(n, curBeat, curTimeSec, bpm);
        const active = resolveActive(n, curBeat, curTimeSec, bpm);
        const open = n.dur >= 2;
        const eighth = n.dur < 1;
        const stemUp = n.s < 4;
        const stemX = stemUp ? x + 6.2 : x - 6.2;
        const stemY2 = stemUp ? y - 33 : y + 33;
        const op = active ? 1 : played ? 0.28 : 0.9;
        const col = active ? 'var(--acc)' : C_NOTE;
        const ledgers: number[] = [];
        if (n.s >= 10) { for (let s = 10; s <= n.s; s += 2) ledgers.push(s); }
        if (n.s <= -2) { for (let s = -2; s >= n.s; s -= 2) ledgers.push(s); }
        return (
          <g key={i} opacity={op} style={{ transition: 'opacity .12s linear' }}>
            {active && <circle cx={x} cy={y} r="14" fill="var(--acc)" opacity="0.14" />}
            {ledgers.map((s) => (
              <line key={s} x1={x - 9} x2={x + 9} y1={yAt(s)} y2={yAt(s)} stroke={col} strokeWidth="1.1" />
            ))}
            <ellipse
              cx={x} cy={y} rx="6.6" ry="5"
              transform={`rotate(-20 ${x} ${y})`}
              fill={open ? 'none' : col}
              stroke={col}
              strokeWidth={open ? 1.7 : 0}
            />
            <line x1={stemX} x2={stemX} y1={y - (stemUp ? 0.5 : -0.5)} y2={stemY2} stroke={col} strokeWidth="1.5" />
            {eighth && (
              <path
                d={stemUp ? `M${stemX} ${stemY2} q9 4 7 16` : `M${stemX} ${stemY2} q9 -4 7 -16`}
                fill="none"
                stroke={col}
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TabView({
  notes,
  totalWidth,
  curBeat,
  curTimeSec, // NUEVO
  bpm,        // NUEVO
  scoreTotal,
}: {
  notes: ScoreNote[];
  totalWidth: number;
  curBeat: number;
  curTimeSec?: number; // NUEVO
  bpm: number;         // NUEVO
  scoreTotal: number;
}) {
  const tTop = 70;
  const tGap = 18;
  const yStr = (s: number) => tTop + s * tGap;
  const bars = barBeats(scoreTotal);

  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display: 'block' }}>
      {[0, 1, 2, 3, 4, 5].map((s) => (
        <line key={s} x1={LEFT - 14} x2={totalWidth - 40} y1={yStr(s)} y2={yStr(s)} stroke={C_LINE} strokeWidth="1" />
      ))}
      {bars.map((b) => {
        const measure = Math.floor(b / 4) + 1;
        return (
          <g key={b}>
            <line x1={xAt(b)} x2={xAt(b)} y1={yStr(0)} y2={yStr(5)} stroke={C_LINE} strokeWidth="1" />
            <text x={xAt(b)} y={STAFF_TOP - 20} fontSize="10" fill="rgba(128,128,128,0.6)" textAnchor="middle">
              {measure}
            </text>
          </g>
        );
      })}
      {notes.map((n, i) => {
        const x = xAt(n.beat);
        const y = yStr(n.tab.string);
        // NUEVO
        const played = resolvePlayed(n, curBeat, curTimeSec, bpm);
        const active = resolveActive(n, curBeat, curTimeSec, bpm);
        const op = active ? 1 : played ? 0.28 : 0.9;
        return (
          <g key={i} opacity={op} style={{ transition: 'opacity .12s linear' }}>
            <rect x={x - 8} y={y - 8} width="16" height="16" rx="4" fill={active ? 'var(--acc)' : '#1a1a1a'} stroke={active ? 'none' : C_LINE} strokeWidth="1" />
            <text x={x} y={y} dy="0.34em" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12.5" fontWeight="700" fill={active ? 'var(--acc-ink)' : C_NOTE}>
              {n.tab.fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RollView({
  notes,
  totalWidth,
  curBeat,
  curTimeSec, // NUEVO
  bpm,        // NUEVO
  scoreTotal,
}: {
  notes: ScoreNote[];
  totalWidth: number;
  curBeat: number;
  curTimeSec?: number; // NUEVO
  bpm: number;         // NUEVO
  scoreTotal: number;
}) {
  const midis = notes.map((n) => n.midi);
  const lo = midis.length ? Math.min(...midis) - 1 : 60;
  const hi = midis.length ? Math.max(...midis) + 1 : 72;
  const laneH = 13;
  const rTop = 22;
  const yMidi = (m: number) => rTop + (hi - m) * laneH;
  const rows: number[] = [];
  for (let m = lo; m <= hi; m++) rows.push(m);
  const bars = barBeats(scoreTotal);

  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display: 'block' }}>
      {rows.map((m) => (
        <g key={m}>
          <line x1={LEFT - 14} x2={totalWidth - 40} y1={yMidi(m) + laneH} y2={yMidi(m) + laneH} stroke={C_LINE_2} strokeWidth="1" />
          {m % 12 === 0 && <rect x={LEFT - 14} y={yMidi(m)} width={totalWidth - LEFT - 26} height={laneH} fill="rgba(255,255,255,0.03)" />}
        </g>
      ))}
      {bars.map((b) => {
        const measure = Math.floor(b / 4) + 1;
        return (
          <g key={b}>
            <line x1={xAt(b)} x2={xAt(b)} y1={rTop} y2={yMidi(lo) + laneH} stroke={C_LINE_2} strokeWidth="1" />
            <text x={xAt(b)} y={STAFF_TOP - 20} fontSize="10" fill="rgba(128,128,128,0.6)" textAnchor="middle">
              {measure}
            </text>
          </g>
        );
      })}
      {notes.map((n, i) => {
        const x = xAt(n.beat);
        const y = yMidi(n.midi);
        const w = Math.max(10, n.dur * PPB - 4);
        // NUEVO
        const played = resolvePlayed(n, curBeat, curTimeSec, bpm);
        const active = resolveActive(n, curBeat, curTimeSec, bpm);
        const fill = active ? 'var(--acc)' : played ? 'rgba(207,207,207,.3)' : 'rgba(207,207,207,.8)';
        return (
          <rect key={i} x={x} y={y + 1.5} width={w} height={laneH - 3} rx="3" fill={fill} style={{ transition: 'fill .12s linear' }} />
        );
      })}
    </svg>
  );
}

function LeftPanel({ view }: { view: string }) {
  if (view === 'tab') {
    return (
      <div className="sheet-left">
        <div className="serif" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--text-2)', writingMode: 'vertical-rl', textOrientation: 'upright' }}>TAB</div>
      </div>
    );
  }
  if (view === 'roll') {
    return (
      <div className="sheet-left">
        <span className="muted" style={{ fontSize: 11, transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>tono →</span>
      </div>
    );
  }
  return (
    <div className="sheet-left">
      <svg width="64" height={SHEET_H} style={{ display: 'block' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" x2="64" y1={STAFF_TOP + i * GAP} y2={STAFF_TOP + i * GAP} stroke={C_LINE} strokeWidth="1" />
        ))}
        <text x="14" y={STAFF_TOP + 4 * GAP + 6} fontFamily="Georgia, serif" fontSize="62" fill={C_NOTE}>𝄞</text>
      </svg>
    </div>
  );
}

type SheetViewerProps = {
  view: 'staff' | 'tab' | 'roll';
  curBeat: number;
  curTimeSec?: number; // NUEVO — opcional para retrocompatibilidad
  bpm?: number;        // NUEVO — opcional, default 120
  loop?: { a: number; b: number } | null;
  loading?: boolean;
  waiting?: boolean;
  waitLabel?: string;
  notes?: ScoreNote[];
  totalBeats?: number;
  emptyMessage?: string;
  aiCaveat?: boolean;
  aiCaveatLabel?: string;
};

export function SheetViewer({
  view,
  curBeat,
  curTimeSec,       // NUEVO
  bpm = 120,        // NUEVO — default seguro
  loop,
  loading,
  waiting,
  waitLabel,
  notes,
  totalBeats,
  emptyMessage,
  aiCaveat,
  aiCaveatLabel,
}: SheetViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(720);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVw(el.clientWidth));
    ro.observe(el);
    setVw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const scoreNotes = notes ?? SCORE.notes;
  const scoreTotal = totalBeats ?? SCORE.totalBeats;
  const isEmpty = scoreNotes.length === 0;
  const displayTotal = isEmpty ? Math.max(scoreTotal, 16) : scoreTotal;
  const totalWidth = xAt(displayTotal) + RIGHT;
  const cursorX = Math.max(200, Math.min(500, vw * 0.50));
  const translate = cursorX - xAt(curBeat);

  // NUEVO: props comunes a todos los sub-views
  const viewProps = {
    notes: scoreNotes,
    totalWidth,
    curBeat,
    curTimeSec, // NUEVO
    bpm,        // NUEVO
    scoreTotal: displayTotal,
  };

  const View = view === 'tab' ? TabView : view === 'roll' ? RollView : StaffView;

  return (
    <div className={`sheet${waiting ? ' waiting-part' : ''}${aiCaveat ? ' score-ai-caveat' : ''}`}>
      <div className="sheet-scroll" ref={wrapRef} style={{ height: SHEET_H }}>
        {loading && (
          <div className="sheet-loading">
            <IconSpark size={28} style={{ color: 'var(--acc)' }} />
            <div className="muted" style={{ fontSize: 13.5 }}>Cargando stems en el navegador…</div>
            <div className="sheet-loadbar"><i className="load-anim" /></div>
          </div>
        )}
        {!loading && isEmpty && emptyMessage && (
          <div className="sheet-wait-overlay">
            <span>{emptyMessage}</span>
          </div>
        )}
        <div className="sheet-track" style={{ transform: `translateX(${translate}px)`, width: totalWidth }}>
          {loop && (
            <div className="loop-band" style={{ left: xAt(loop.a), width: (loop.b - loop.a) * PPB }} />
          )}
          {!isEmpty && <View {...viewProps} />}
        </div>
        <LeftPanel view={view} />
        <div className="sheet-fade-r" />
        <div className="sheet-cursor" style={{ left: cursorX }} />
        <PlayheadCursor cursorX={cursorX} />
        {waiting && !loading && !isEmpty && (
          <div className="sheet-wait-overlay"><span>{waitLabel}</span></div>
        )}
        {aiCaveat && !loading && !isEmpty && (
          <div className="sheet-ai-overlay" aria-hidden="true">
            <span className="sheet-ai-watermark">{aiCaveatLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
