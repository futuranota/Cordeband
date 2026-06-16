/* screen-player.jsx — Reproductor + Partitura + Tarima + sincronización por turno */

const DEF_VOL = { vocals:78, drums:82, bass:80, piano:70, guitar:76, other:64 };

/* Ventanas (fracción del total) en las que TU instrumento toca.
   Entre ellas, descansas: la partitura no se sincroniza todavía. */
const PARTS_F = [[0.06,0.26],[0.34,0.58],[0.68,0.92]];
const LEAD_BEATS = 8;   // cuánto antes empieza el aviso

/* Arreglo aproximado del resto de la banda (para iluminar la tarima). */
const SCHED = {
  drums:  [[0.05,1.0]],
  bass:   [[0.11,1.0]],
  guitar: [[0.06,0.26],[0.34,0.58],[0.68,0.92]],
  piano:  [[0.0,0.30],[0.40,0.66],[0.80,1.0]],
  vocals: [[0.20,0.42],[0.52,0.72],[0.86,1.0]],
  other:  [[0.30,0.70]],
};
const inWins = (wins, f) => wins.some(([a,b]) => f>=a && f<b);

function TempoControl({ tempo, setTempo }){
  const { t } = window.useT();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pct = Math.round(tempo*100);
  return (
    <div style={{ position:"relative" }} ref={ref}>
      <button className={"chip-btn" + (pct!==100?" on":"")} onClick={() => setOpen(o=>!o)}>
        <window.IconGauge size={14}/> {pct}%
      </button>
      {open && (
        <div className="card pop">
          <div className="row spread" style={{ marginBottom:10 }}>
            <span style={{ fontSize:12.5, fontWeight:700 }}>{t("player.tempo")}</span>
            <span className="muted tnum" style={{ fontSize:12.5 }}>{pct}%</span>
          </div>
          <input className="slider" type="range" min="50" max="150" step="5"
                 value={pct} onChange={(e) => setTempo(Number(e.target.value)/100)} />
          <div className="row spread" style={{ marginTop:8, fontSize:11, color:"var(--text-4)" }}>
            <span>50%</span><span>{t("player.sameTone")}</span><span>150%</span>
          </div>
          <div className="row gap-8" style={{ marginTop:12 }}>
            {[75,100,125].map(v => (
              <button key={v} className="chip-btn" style={{ flex:1, justifyContent:"center" }}
                      onClick={() => setTempo(v/100)}>{v}%</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Banner de turno: esperando / prepárate / es tu turno */
function TurnBanner({ status, secsToEntry, yourTime }){
  const { t } = window.useT();
  if(status === "live"){
    return (
      <div className="turn-banner live">
        <div className="turn-dot"><span className="eq"><i/><i/><i/><i/></span></div>
        <div className="turn-main">
          <div className="turn-title">{t("player.liveT")}</div>
          <div className="turn-sub">{t("player.liveS")}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div className="turn-count">{window.fmtTime(yourTime)}</div>
          <div className="turn-sub" style={{ marginTop:2 }}>{t("common.you")}</div>
        </div>
      </div>
    );
  }
  if(status === "ready"){
    return (
      <div className="turn-banner ready">
        <div className="turn-dot"><window.IconSpark size={20}/></div>
        <div className="turn-main">
          <div className="turn-title">{t("player.readyT")}</div>
          <div className="turn-sub">{t("player.readyS")}</div>
        </div>
        <div className="turn-count">{secsToEntry!=null ? Math.max(0, Math.ceil(secsToEntry)) : "–"}</div>
      </div>
    );
  }
  return (
    <div className="turn-banner waiting">
      <div className="turn-dot"><window.IconClock size={19}/></div>
      <div className="turn-main">
        <div className="turn-title">{t("player.waitT")}</div>
        <div className="turn-sub">{t("player.syncOff")}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div className="turn-sub">{t("player.waitNext")}</div>
        <div className="serif" style={{ fontWeight:700, fontSize:18, color:"#fff", marginTop:2 }}>
          {secsToEntry!=null ? window.fmtTime(secsToEntry) : "—"}
        </div>
      </div>
    </div>
  );
}

function StemMixer({ song, instrument, vols, setVol }){
  const { t } = window.useT();
  const stems = window.STEMS.filter(s => song.instruments.includes(s.key));
  return (
    <div className="card mixer">
      <div className="row spread">
        <div className="row gap-8"><window.IconWave size={16}/> <span style={{ fontWeight:700, fontSize:14 }}>{t("player.mixT")}</span></div>
        <span className="muted" style={{ fontSize:12 }}>{t("player.mixSub")}</span>
      </div>
      <div className="mixer-grid">
        {stems.map(s => {
          const Icon = s.Icon;
          const muted = vols[s.key] === 0;
          const isYou = s.key === instrument;
          return (
            <div key={s.key} className={"stem" + (muted?" is-muted":"")}>
              <div className="stem-top">
                <span className="stem-name">
                  <span className="stem-ico"><Icon size={15} sw={1.5}/></span>
                  {t("inst."+s.key)}{isYou && <span className="acc-text" style={{ fontSize:11, fontWeight:700 }}>· {t("common.you")}</span>}
                </span>
                <button className={"stem-mute" + (muted?" active":"")}
                        onClick={() => setVol(s.key, muted ? (DEF_VOL[s.key]||70) : 0)}>
                  {muted ? <window.IconMute size={16}/> : <window.IconVolume size={16}/>}
                </button>
              </div>
              <input className="slider" type="range" min="0" max="100"
                     value={vols[s.key]} onChange={(e) => setVol(s.key, Number(e.target.value))}/>
              <div className="stem-val">{vols[s.key]}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AffiliateRail({ instrument, layout, onClick }){
  const { t } = window.useT();
  const items = window.getAffiliates(instrument);
  return (
    <aside className="aff-rail">
      <div className="aff-head">
        <div>
          <span className="eyebrow" style={{ fontSize:11, whiteSpace:"nowrap" }}>{t("player.affFor")} {t("inst."+instrument).toLowerCase()}</span>
          <div className="serif" style={{ fontSize:17, fontWeight:700, marginTop:2, color:"#fff" }}>{t("player.affRec")}</div>
        </div>
        {layout==="bottom" && <span className="muted" style={{ fontSize:12 }}>{t("player.commission")}</span>}
      </div>
      <div className="aff-list">
        {items.map(p => {
          const Icon = p.Icon;
          const href = p.url || null;
          return (
            <a key={p.id} className="card aff-card" href={href || undefined}
               target={href ? "_blank" : undefined} rel={href ? "noopener noreferrer" : undefined}
               onClick={() => onClick(p)}>
              <div className="aff-thumb">
                {p.image
                  ? <img src={p.image} alt={p.name || p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : (Icon ? <Icon size={22} sw={1.4}/> : <window.IconCart size={20}/>)}
              </div>
              <div className="aff-info">
                <div className="aff-name">{p.name || p.title}</div>
                <div className="aff-cat">{p.cat || p.platform}</div>
                <div className="aff-buy">
                  <span className="aff-price">{p.price}</span>
                  <span className="aff-go">{p.platform || "Ver"} <window.IconExternal size={12}/></span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

function PlayerScreen({ go, song, instrument, t: tw, authed }){
  const { t } = window.useT();
  const S = song || window.LIBRARY[0];
  const inst = instrument || "guitar";
  const instName = t("inst."+inst);
  const bpm = S.bpm || 84;
  const total = window.SCORE.totalBeats;
  const partsBeats = React.useMemo(() => PARTS_F.map(([a,b]) => ({ a:a*total, b:b*total })), [total]);

  const [loading, setLoading] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const [curBeat, setCurBeat] = React.useState(0);
  const [yourTime, setYourTime] = React.useState(0);
  const [tempo, setTempo] = React.useState(1);
  const [view, setView] = React.useState("staff");
  const [loop, setLoop] = React.useState(null);
  const [pendingA, setPendingA] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [vols, setVols] = React.useState(() => {
    const v = {};
    window.STEMS.forEach(s => { v[s.key] = s.key === inst ? 0 : (DEF_VOL[s.key]||70); });
    return v;
  });

  const beatRef = React.useRef(0);
  const loopRef = React.useRef(loop);
  const tempoRef = React.useRef(tempo);
  const yourBeatsRef = React.useRef(0);
  const partsRef = React.useRef(partsBeats);
  loopRef.current = loop; tempoRef.current = tempo; partsRef.current = partsBeats;

  React.useEffect(() => { beatRef.current = curBeat; }, [curBeat]);

  React.useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(id);
  }, []);

  // motor de reproducción
  React.useEffect(() => {
    if(!playing) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last)/1000; last = now;
      const prev = beatRef.current;
      let b = prev + dt * (bpm/60) * tempoRef.current;
      const lp = loopRef.current;
      if(lp && b >= lp.b) b = lp.a;
      if(b >= total){ b = 0; yourBeatsRef.current = 0; setYourTime(0); setPlaying(false); }
      // acumula el tiempo "en pista" solo durante tus partes
      const mid = (prev + b) / 2;
      if(partsRef.current.some(p => mid >= p.a && mid < p.b) && b > prev){
        yourBeatsRef.current += (b - prev);
        setYourTime(yourBeatsRef.current * 60 / bpm);
      }
      beatRef.current = b; setCurBeat(b);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, bpm, total]);

  const setVol = (k, v) => setVols(p => ({ ...p, [k]: v }));
  const curTime = curBeat * 60 / bpm;
  const totalTime = total * 60 / bpm;
  const ratio = curBeat/total;
  const rate = (bpm/60) * tempo;

  // estado del turno
  let status = "waiting", curPart = null, nextPart = null;
  for(const p of partsBeats){ if(curBeat >= p.a && curBeat < p.b){ curPart = p; break; } }
  if(curPart){ status = "live"; }
  else {
    nextPart = partsBeats.find(p => p.a > curBeat) || null;
    if(nextPart){ status = (nextPart.a - curBeat) <= LEAD_BEATS ? "ready" : "waiting"; }
  }
  const secsToEntry = nextPart ? (nextPart.a - curBeat) / rate : null;
  const isWaiting = status !== "live";

  // aviso anticipado (cue)
  const showReadyCue = playing && status === "ready" && secsToEntry != null && secsToEntry <= 4.4;
  const cueNum = showReadyCue ? Math.max(1, Math.ceil(secsToEntry)) : null;
  const justEntered = playing && curPart && (curBeat - curPart.a) < 0.9;

  // tarima: quién suena ahora (en el reproductor SIEMPRE es controlado:
  // [] cuando está en pausa, para que no rote el resaltado de demostración)
  const f = curBeat / total;
  const activeKeys = playing ? S.instruments.filter(k => {
    if(k === inst) return !!curPart;
    return inWins(SCHED[k] || [], f);
  }) : [];

  const scrubRef = React.useRef(null);
  const seek = (clientX) => {
    const el = scrubRef.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const rt = Math.max(0, Math.min(1, (clientX - r.left)/r.width));
    const b = rt*total; beatRef.current = b; setCurBeat(b);
  };
  const onScrubDown = (e) => {
    seek(e.clientX);
    const move = (ev) => seek(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  };

  const loopClick = () => {
    if(loop){ setLoop(null); setPendingA(null); return; }
    if(pendingA === null){ setPendingA(curBeat); return; }
    const a = Math.min(pendingA, curBeat), b = Math.max(pendingA, curBeat);
    if(b - a < 1){ setPendingA(null); return; }
    setLoop({ a, b }); setPendingA(null);
  };
  const loopLabel = loop ? t("player.loopOn") : pendingA!==null ? t("player.loopB") : t("player.loopOff");

  const showToast = (p) => {
    setToast(`${p.platform} · ${p.name}`);
    setTimeout(() => setToast(null), 2600);
  };

  // descarga del MP3 (sin tu instrumento) — requiere cuenta
  const downloadMp3 = () => {
    if(!authed){ go("signup"); return; }
    setToast(`${t("player.dlPrep")} ${instName}…`);
    setTimeout(() => setToast(`${t("player.dlReady")} Cordeband — ${S.title} (–${instName}).mp3`), 1700);
  };

  const layout = tw.playerLayout || "side";

  return (
    <main className="wrap app-main page">
      <button className="btn btn-ghost btn-sm" onClick={() => go("instrument")} style={{ marginBottom:20 }}>
        <window.IconArrowL size={15}/> {t("player.changeInst")}
      </button>

      <div className="player" data-aff={layout}>
        <section className="stage">
          <div className="player-head">
            <div className="now-playing">
              <div className="np-title">{S.title}</div>
              <div className="np-meta">
                <span>{S.artist}</span><span style={{ opacity:.4 }}>·</span>
                <span className="muted-tag"><span className="dot"></span>{instName} {t("player.muted")}</span>
                <span style={{ opacity:.4 }}>·</span>
                <span>{S.bpm} BPM · {S.keySig}</span>
              </div>
            </div>
            <div className="viewtoggle">
              {[["staff",t("player.staff")],["tab",t("player.tab")],["roll",t("player.roll")]].map(([k,l]) => (
                <button key={k} className={view===k?"on":""} onClick={() => setView(k)}>{l}</button>
              ))}
            </div>
          </div>

          {/* Tarima */}
          <window.StagePanel
            instruments={S.instruments}
            youKey={inst}
            activeKeys={activeKeys}
            title={t("sel.stageTitle")}
            sub={t("sel.stageSub")} />

          {/* Banner de turno */}
          <TurnBanner status={status} secsToEntry={secsToEntry} yourTime={yourTime}/>

          {/* Partitura */}
          <window.SheetViewer view={view} curBeat={curBeat} loop={loop} loading={loading}
            waiting={isWaiting && !loading && playing} waitLabel={t("player.waitOverlay")}/>

          {/* Transporte */}
          <div className="card transport">
            <div className="transport-row">
              <button className="play-btn" disabled={loading}
                      onClick={() => setPlaying(p => !p)}>
                {playing ? <window.IconPause size={20}/> : <window.IconPlay size={20}/>}
              </button>
              <span className="time">{window.fmtTime(curTime)}</span>
              <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                <div className="scrub-track">
                  {partsBeats.map((p,i) => (
                    <div key={i} className="scrub-parts" style={{ left:`${p.a/total*100}%`, width:`${(p.b-p.a)/total*100}%` }}/>
                  ))}
                  {loop && <div className="scrub-loop" style={{ left:`${loop.a/total*100}%`, width:`${(loop.b-loop.a)/total*100}%` }}/>}
                  <div className="scrub-fill" style={{ width:`${ratio*100}%` }}/>
                </div>
                <div className="scrub-head" style={{ left:`${ratio*100}%` }}/>
              </div>
              <span className="time" style={{ textAlign:"right" }}>{window.fmtTime(totalTime)}</span>
            </div>
            <div className="mini-ctrl" style={{ marginTop:14, flexWrap:"wrap" }}>
              <TempoControl tempo={tempo} setTempo={setTempo}/>
              <button className={"chip-btn" + (loop||pendingA!==null?" on":"")} onClick={loopClick}>
                <window.IconLoop size={14}/> {loopLabel}
              </button>
              {(loop||pendingA!==null) && (
                <button className="chip-btn" onClick={() => { setLoop(null); setPendingA(null); }}>{t("player.remove")}</button>
              )}
              <button className="chip-btn" onClick={() => { beatRef.current=0; setCurBeat(0); yourBeatsRef.current=0; setYourTime(0); }}>
                <window.IconReset size={14}/> {t("player.restart")}
              </button>
              <div className="grow"></div>
              <button className="btn btn-primary btn-sm" onClick={downloadMp3}>
                <window.IconUpload size={14} style={{ transform:"rotate(180deg)" }}/> {t("player.download")}
              </button>
            </div>
          </div>

          <StemMixer song={S} instrument={inst} vols={vols} setVol={setVol}/>
        </section>

        <AffiliateRail instrument={inst} layout={layout} onClick={showToast}/>
      </div>

      {/* Aviso anticipado de entrada */}
      {showReadyCue && (
        <div className="cue">
          <span className="cue-n">{cueNum}</span>
          <span className="cue-t">{t("player.cueReady")} {cueNum}…</span>
        </div>
      )}
      {!showReadyCue && justEntered && (
        <div className="cue go">
          <span className="cue-n">▶</span>
          <span className="cue-t">{t("player.cueGo")}</span>
        </div>
      )}

      {toast && <div className="toast"><window.IconCheck size={15} sw={2.2}/>{toast}</div>}
    </main>
  );
}

Object.assign(window, { PlayerScreen });
