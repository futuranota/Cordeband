/* sheet.jsx — Visor de partitura: notación estándar, tablatura y piano roll
   Cursor sincronizado + scroll automático. Tema oscuro. */

const PPB = 56;
const LEFT = 92;
const RIGHT = 220;
const STAFF_TOP = 78;
const GAP = 13;
const SHEET_H = 230;

const C_LINE = "rgba(255,255,255,0.13)";
const C_LINE_2 = "rgba(255,255,255,0.07)";
const C_NOTE = "#cfcfcf";
const ACC = { fill: "var(--acc)" };
const ACC_S = { stroke: "var(--acc)" };

const xAt = (beat) => LEFT + beat * PPB;
const yAt = (s) => STAFF_TOP + ((8 - s) / 2) * GAP;

/* ---------- Notación estándar ---------- */
function StaffView({ notes, totalWidth, curBeat }){
  const staffLines = [0,1,2,3,4];
  const bars = [];
  for(let b = 0; b <= window.SCORE.totalBeats; b += 4) bars.push(b);

  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display:"block" }}>
      {staffLines.map(i => (
        <line key={i} x1={LEFT-14} x2={totalWidth-40} y1={STAFF_TOP+i*GAP} y2={STAFF_TOP+i*GAP}
              stroke={C_LINE} strokeWidth="1"/>
      ))}
      {bars.map(b => (
        <line key={b} x1={xAt(b)} x2={xAt(b)} y1={STAFF_TOP} y2={STAFF_TOP+4*GAP}
              stroke={C_LINE} strokeWidth="1"/>
      ))}
      {notes.map((n, i) => {
        const x = xAt(n.beat);
        const y = yAt(n.s);
        const played = n.beat + n.dur <= curBeat;
        const active = curBeat >= n.beat && curBeat < n.beat + n.dur;
        const open = n.dur >= 2;
        const eighth = n.dur < 1;
        const stemUp = n.s < 4;
        const stemX = stemUp ? x + 6.2 : x - 6.2;
        const stemY2 = stemUp ? y - 33 : y + 33;
        const op = active ? 1 : played ? 0.28 : 0.9;
        const col = active ? "var(--acc)" : C_NOTE;
        const ledgers = [];
        if(n.s >= 10){ for(let s=10; s<=n.s; s+=2) ledgers.push(s); }
        if(n.s <= -2){ for(let s=-2; s>=n.s; s-=2) ledgers.push(s); }
        return (
          <g key={i} opacity={op} style={{ transition:"opacity .12s linear" }}>
            {active && <circle cx={x} cy={y} r="14" style={{ fill:"var(--acc)" }} opacity="0.14"/>}
            {ledgers.map(s => (
              <line key={s} x1={x-9} x2={x+9} y1={yAt(s)} y2={yAt(s)} stroke={col} strokeWidth="1.1"/>
            ))}
            <ellipse cx={x} cy={y} rx="6.6" ry="5"
                     transform={`rotate(-20 ${x} ${y})`}
                     style={{ fill: open ? "none" : col, stroke: col, strokeWidth: open ? 1.7 : 0 }}/>
            <line x1={stemX} x2={stemX} y1={y - (stemUp?0.5:-0.5)} y2={stemY2}
                  style={{ stroke: col }} strokeWidth="1.5"/>
            {eighth && (
              <path d={stemUp
                ? `M${stemX} ${stemY2} q9 4 7 16`
                : `M${stemX} ${stemY2} q9 -4 7 -16`}
                fill="none" style={{ stroke: col }} strokeWidth="1.5"/>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Tablatura ---------- */
function TabView({ notes, totalWidth, curBeat }){
  const strings = [0,1,2,3,4,5];
  const tTop = 70, tGap = 18;
  const yStr = (s) => tTop + s*tGap;
  const bars = [];
  for(let b = 0; b <= window.SCORE.totalBeats; b += 4) bars.push(b);
  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display:"block" }}>
      {strings.map(s => (
        <line key={s} x1={LEFT-14} x2={totalWidth-40} y1={yStr(s)} y2={yStr(s)} stroke={C_LINE} strokeWidth="1"/>
      ))}
      {bars.map(b => (
        <line key={b} x1={xAt(b)} x2={xAt(b)} y1={yStr(0)} y2={yStr(5)} stroke={C_LINE} strokeWidth="1"/>
      ))}
      {notes.map((n,i) => {
        const x = xAt(n.beat), y = yStr(n.tab.string);
        const played = n.beat + n.dur <= curBeat;
        const active = curBeat >= n.beat && curBeat < n.beat + n.dur;
        const op = active ? 1 : played ? 0.28 : 0.9;
        return (
          <g key={i} opacity={op} style={{ transition:"opacity .12s linear" }}>
            <rect x={x-8} y={y-8} width="16" height="16" rx="4"
                  style={{ fill: active ? "var(--acc)" : "#1a1a1a" }} stroke={active?"none":C_LINE} strokeWidth="1"/>
            <text x={x} y={y} dy="0.34em" textAnchor="middle"
                  fontFamily='"Manrope", sans-serif' fontSize="12.5" fontWeight="700"
                  style={{ fill: active ? "var(--acc-ink, #0a0a0a)" : C_NOTE }}>{n.tab.fret}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Piano roll ---------- */
function RollView({ notes, totalWidth, curBeat }){
  const midis = notes.map(n => n.midi);
  const lo = Math.min(...midis) - 1, hi = Math.max(...midis) + 1;
  const laneH = 13, rTop = 22;
  const yMidi = (m) => rTop + (hi - m) * laneH;
  const rows = [];
  for(let m = lo; m <= hi; m++) rows.push(m);
  const bars = [];
  for(let b = 0; b <= window.SCORE.totalBeats; b += 4) bars.push(b);
  return (
    <svg width={totalWidth} height={SHEET_H} style={{ display:"block" }}>
      {rows.map(m => (
        <g key={m}>
          <line x1={LEFT-14} x2={totalWidth-40} y1={yMidi(m)+laneH} y2={yMidi(m)+laneH}
                stroke={C_LINE_2} strokeWidth="1"/>
          {m % 12 === 0 && <rect x={LEFT-14} y={yMidi(m)} width={totalWidth-LEFT-26} height={laneH} fill="rgba(255,255,255,0.03)"/>}
        </g>
      ))}
      {bars.map(b => (
        <line key={b} x1={xAt(b)} x2={xAt(b)} y1={rTop} y2={yMidi(lo)+laneH} stroke={C_LINE_2} strokeWidth="1"/>
      ))}
      {notes.map((n,i) => {
        const x = xAt(n.beat), y = yMidi(n.midi);
        const w = Math.max(10, n.dur*PPB - 4);
        const played = n.beat + n.dur <= curBeat;
        const active = curBeat >= n.beat && curBeat < n.beat + n.dur;
        const sty = active ? { fill:"var(--acc)" } : { fill: played ? "rgba(207,207,207,.3)" : "rgba(207,207,207,.8)" };
        return <rect key={i} x={x} y={y+1.5} width={w} height={laneH-3} rx="3" style={{ ...sty, transition:"fill .12s linear" }}/>;
      })}
    </svg>
  );
}

/* ---------- Overlay izquierdo fijo (clave / etiquetas) ---------- */
function LeftPanel({ view }){
  if(view === "tab"){
    return (
      <div className="sheet-left">
        <div className="serif" style={{ fontSize:13, fontWeight:700, letterSpacing:"0.18em", color:"var(--text-2)", writingMode:"vertical-rl", textOrientation:"upright" }}>TAB</div>
      </div>
    );
  }
  if(view === "roll"){
    return <div className="sheet-left"><span className="muted" style={{ fontSize:11, transform:"rotate(-90deg)", whiteSpace:"nowrap" }}>tono →</span></div>;
  }
  return (
    <div className="sheet-left">
      <svg width="64" height={SHEET_H} style={{ display:"block" }}>
        {[0,1,2,3,4].map(i => <line key={i} x1="0" x2="64" y1={STAFF_TOP+i*GAP} y2={STAFF_TOP+i*GAP} stroke={C_LINE} strokeWidth="1"/>)}
        <text x="14" y={STAFF_TOP+4*GAP+6} fontFamily="Georgia, serif" fontSize="62" fill={C_NOTE}>𝄞</text>
        <text x="46" y={STAFF_TOP+2*GAP+2} fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill={C_NOTE} textAnchor="middle">4</text>
        <text x="46" y={STAFF_TOP+4*GAP+1} fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill={C_NOTE} textAnchor="middle">4</text>
      </svg>
    </div>
  );
}

/* ---------- Visor ---------- */
function SheetViewer({ view, curBeat, loop, loading, waiting, waitLabel }){
  const wrapRef = React.useRef(null);
  const [vw, setVw] = React.useState(720);
  React.useEffect(() => {
    const el = wrapRef.current; if(!el) return;
    const ro = new ResizeObserver(() => setVw(el.clientWidth));
    ro.observe(el); setVw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const notes = window.SCORE.notes;
  const totalWidth = xAt(window.SCORE.totalBeats) + RIGHT;
  const cursorX = Math.max(150, Math.min(340, vw * 0.30));
  const translate = cursorX - xAt(curBeat);

  const View = view === "tab" ? TabView : view === "roll" ? RollView : StaffView;

  return (
    <div className={"sheet" + (waiting ? " waiting-part" : "")}>
      <div className="sheet-scroll" ref={wrapRef} style={{ height: SHEET_H }}>
        {loading && (
          <div className="sheet-loading">
            <window.Brandmark/>
            <div className="muted" style={{ fontSize:13.5 }}>Cargando stems en el navegador…</div>
            <div className="sheet-loadbar"><i className="load-anim"/></div>
          </div>
        )}
        <div className="sheet-track" style={{ transform:`translateX(${translate}px)`, width: totalWidth }}>
          {loop && (
            <div className="loop-band" style={{ left: xAt(loop.a), width: (loop.b-loop.a)*PPB }}/>
          )}
          <View notes={notes} totalWidth={totalWidth} curBeat={curBeat}/>
        </div>
        <LeftPanel view={view}/>
        <div className="sheet-fade-r"/>
        <div className="sheet-cursor" style={{ left: cursorX }}/>
        {waiting && !loading && (
          <div className="sheet-wait-overlay"><span>{waitLabel}</span></div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SheetViewer, PPB });
