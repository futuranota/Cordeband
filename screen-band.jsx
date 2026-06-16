/* screen-band.jsx — Sala de banda (Plan Banda)
   Crear sala → lobby con miembros en vivo (simulado) → Play sincronizado → tocando.
   Vista de líder y vista de invitado. */

const ROOM_LS = "cordeband_room_v1";

function loadRoom(){
  try { return JSON.parse(localStorage.getItem(ROOM_LS)); } catch(e){ return null; }
}
function persistRoom(r){
  try { r ? localStorage.setItem(ROOM_LS, JSON.stringify(r)) : localStorage.removeItem(ROOM_LS); } catch(e){}
}

/* Avatar de miembro */
function MemberAvatar({ ini, color, size = 38 }){
  return (
    <span className="band-ava" style={{ width:size, height:size, background:color, color:"#0a0a0a" }}>{ini}</span>
  );
}

/* Tarjeta de miembro en el lobby */
function MemberRow({ m, isYou, isLeader, t }){
  const inst = m.instrument ? window.INSTRUMENTS[m.instrument] : null;
  const Icon = inst ? inst.Icon : null;
  const stLabel = m.status === "ready" ? t("room.stReady")
    : m.instrument ? t("room.stReady") : t("room.stChoosing");
  return (
    <div className={"band-member" + (m.ready ? " ready" : "")}>
      <MemberAvatar ini={m.ini} color={m.color}/>
      <div className="grow" style={{ minWidth:0 }}>
        <div className="row gap-8" style={{ alignItems:"center" }}>
          <span className="band-name">{m.name}{isYou && <span className="muted"> · {t("room.you")}</span>}</span>
          {isLeader && <span className="band-leadtag">{t("room.leaderTag")}</span>}
        </div>
        <div className="band-inst">
          {Icon ? <><Icon size={13} sw={1.5}/> {t("inst."+m.instrument)}</> : <span className="muted">{t("room.stChoosing")}</span>}
        </div>
      </div>
      <span className={"band-status" + (m.ready ? " ok" : "")}>
        {m.ready ? <window.IconCheck size={13} sw={2.4}/> : <span className="band-dot"/>}
        {m.ready ? t("room.stReady") : t("room.stJoined")}
      </span>
    </div>
  );
}

/* ---------- Crear sala (líder) ---------- */
function CreateRoom({ go, onCreate, songs }){
  const { t } = window.useT();
  const [songId, setSongId] = React.useState(songs[0] ? songs[0].id : null);
  const [name, setName] = React.useState("");
  const song = songs.find(s => s.id === songId) || songs[0];
  return (
    <main className="wrap app-main page" style={{ maxWidth:760 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => go("dashboard")} style={{ marginBottom:22 }}>
        <window.IconArrowL size={15}/> {t("nav.library")}
      </button>
      <span className="eyebrow">{t("room.eyebrow")}</span>
      <h1 className="h1" style={{ fontSize:"clamp(30px,4vw,46px)", marginTop:12 }}>{t("room.createTitle")}</h1>
      <p className="lead" style={{ marginTop:14, maxWidth:"52ch" }}>{t("room.createSub")}</p>

      <div className="card" style={{ padding:26, marginTop:30 }}>
        <label className="field-label">{t("room.roomName")}</label>
        <input className="input" value={name} placeholder={t("room.roomNamePh")} onChange={(e) => setName(e.target.value)}/>

        <label className="field-label" style={{ marginTop:20 }}>{t("room.chooseSong")}</label>
        <div className="band-songpick">
          {songs.map(s => (
            <button key={s.id} className={"band-song" + (s.id===songId ? " sel" : "")} onClick={() => setSongId(s.id)}>
              <span className="band-song-glyph">{s.glyph}</span>
              <span className="grow" style={{ textAlign:"left", minWidth:0 }}>
                <span className="band-song-title">{s.title}</span>
                <span className="band-song-meta">{s.artist} · {s.instruments.length} {t("room.members").toLowerCase()}</span>
              </span>
              {s.id===songId && <window.IconCheck size={16} sw={2.4}/>}
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-lg btn-block" style={{ marginTop:24 }}
                disabled={!song}
                onClick={() => onCreate({ name: name.trim() || song.title, song })}>
          <window.IconBand size={17}/> {t("room.create")}
        </button>
        <div className="band-syncnote"><window.IconSpark size={14}/> {t("room.syncNote")}</div>
      </div>
    </main>
  );
}

/* ---------- Sala activa (lobby / playing) ---------- */
function ActiveRoom({ go, room, setRoom, asGuest }){
  const { t } = window.useT();
  const [copied, setCopied] = React.useState(false);
  const [countdown, setCountdown] = React.useState(null);
  const youId = asGuest ? "you_guest" : "you_leader";

  // Miembros simulados que se van uniendo en el lobby.
  React.useEffect(() => {
    if(room.status !== "waiting") return;
    const timers = window.SIM_MEMBERS.map(sm =>
      setTimeout(() => {
        setRoom(r => {
          if(!r || r.members.some(m => m.id === sm.id)) return r;
          return { ...r, members: [...r.members, { ...sm, ready:false }] };
        });
      }, sm.delay)
    );
    // y luego se marcan "listos"
    const ready = window.SIM_MEMBERS.map(sm =>
      setTimeout(() => {
        setRoom(r => r ? { ...r, members: r.members.map(m => m.id===sm.id ? { ...m, ready:true } : m) } : r);
      }, sm.delay + 1600)
    );
    return () => { timers.forEach(clearTimeout); ready.forEach(clearTimeout); };
  }, [room.status]);

  const copy = () => {
    const url = "cordeband.app/#band/" + room.code;
    try { navigator.clipboard && navigator.clipboard.writeText(url); } catch(e){}
    setCopied(true); setTimeout(() => setCopied(false), 1700);
  };

  const startAll = () => {
    setCountdown(3);
  };
  React.useEffect(() => {
    if(countdown === null) return;
    if(countdown <= 0){
      setRoom(r => r ? { ...r, status:"playing", startedAt: Date.now() } : r);
      setCountdown(null);
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const setYourInstrument = (k) => {
    setRoom(r => r ? { ...r, members: r.members.map(m => m.id===youId ? { ...m, instrument:k, ready:true } : m) } : r);
  };

  const you = room.members.find(m => m.id === youId);
  const others = room.members.filter(m => m.id !== youId);
  const readyCount = room.members.filter(m => m.ready).length;
  const allReady = room.members.length > 1 && readyCount === room.members.length;

  // Vista TOCANDO
  if(room.status === "playing"){
    const yourInst = (you && you.instrument) || "guitar";
    return (
      <main className="wrap app-main page">
        <div className="band-livebar">
          <span className="band-livetag"><span className="band-livedot"/> {t("room.live")}</span>
          <div className="grow">
            <div className="band-livetitle">{room.song.title}</div>
            <div className="muted" style={{ fontSize:13 }}>{room.name} · {room.members.length} {t("room.members").toLowerCase()} · {t("room.everyonePlaying")}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setRoom(r => ({ ...r, status:"waiting", startedAt:null })); }}>
            {t("room.stopAll")}
          </button>
        </div>

        <div className="band-liveroster">
          {room.members.map(m => {
            const inst = m.instrument ? window.INSTRUMENTS[m.instrument] : window.INSTRUMENTS.guitar;
            const Icon = inst.Icon;
            return (
              <div key={m.id} className="band-livecard">
                <MemberAvatar ini={m.ini} color={m.color} size={34}/>
                <div style={{ minWidth:0 }}>
                  <div className="band-name" style={{ fontSize:13 }}>{m.name}{m.id===youId && <span className="muted"> · {t("room.you")}</span>}</div>
                  <div className="band-inst"><Icon size={12} sw={1.5}/> {t("inst."+(m.instrument||"guitar"))}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* El reproductor real, con TU instrumento */}
        <window.PlayerScreen go={go} song={room.song} instrument={yourInst} t={window.__tweaks||{}} authed={true} embedded={true}/>
      </main>
    );
  }

  // Vista LOBBY
  return (
    <main className="wrap app-main page" style={{ maxWidth:880 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => { go("dashboard"); }} style={{ marginBottom:20 }}>
        <window.IconArrowL size={15}/> {t("nav.library")}
      </button>

      <div className="band-lobby-head">
        <div>
          <span className="eyebrow">{t("room.lobby")} · {asGuest ? t("room.guest") : t("room.leader")}</span>
          <h1 className="h1" style={{ fontSize:"clamp(28px,3.4vw,42px)", marginTop:10 }}>{room.name}</h1>
          <div className="row gap-12" style={{ marginTop:10, flexWrap:"wrap" }}>
            <span className="pill"><span className="band-song-glyph" style={{ width:20, height:20, fontSize:12 }}>{room.song.glyph}</span> {room.song.title}</span>
            <span className="pill"><window.IconBand size={13}/> {room.members.length} {t("room.inRoom")}</span>
            <span className="pill pill-ink">{t("room.code")} {room.code}</span>
          </div>
        </div>
      </div>

      <div className="band-grid">
        {/* Miembros */}
        <div className="card" style={{ padding:22 }}>
          <div className="row spread" style={{ marginBottom:14 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>{t("room.members")}</span>
            <span className="muted tnum" style={{ fontSize:12.5 }}>{readyCount}/{room.members.length} {t("room.stReady").toLowerCase()}</span>
          </div>
          <div className="band-memberlist">
            {you && <MemberRow m={you} isYou={true} isLeader={!asGuest} t={t}/>}
            {others.map(m => <MemberRow key={m.id} m={m} isLeader={m.id==="leader_seed"} t={t}/>)}
          </div>
        </div>

        {/* Panel derecho: tu instrumento + share + play */}
        <div className="col gap-16">
          {/* Elegir tu instrumento */}
          <div className="card" style={{ padding:20 }}>
            <span style={{ fontWeight:700, fontSize:14 }}>{you && you.instrument ? t("room.yourInst") : t("room.pickInst")}</span>
            <div className="band-instpick">
              {room.song.instruments.map(k => {
                const Icon = window.INSTRUMENTS[k].Icon;
                const sel = you && you.instrument === k;
                const taken = others.some(m => m.instrument === k);
                return (
                  <button key={k} className={"band-instbtn" + (sel?" sel":"") + (taken?" taken":"")}
                          onClick={() => setYourInstrument(k)} disabled={taken && !sel}>
                    <Icon size={20} sw={1.5}/>
                    <span>{t("inst."+k)}</span>
                    {taken && !sel && <span className="band-taken-x">●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compartir link */}
          <div className="card" style={{ padding:20 }}>
            <span className="field-label">{t("room.share")}</span>
            <div className="share-link" style={{ marginTop:0 }}>
              <window.IconBand size={15} style={{ color:"var(--acc)", flex:"0 0 auto" }}/>
              <span className="url">cordeband.app/#band/{room.code}</span>
              <button className="btn btn-primary btn-sm" onClick={copy}>{copied ? t("room.copied") : t("room.copyLink")}</button>
            </div>
          </div>

          {/* Play sincronizado (solo líder) */}
          {!asGuest ? (
            <div className="card band-playcard">
              <button className="band-syncplay" onClick={startAll} disabled={countdown !== null}>
                {countdown !== null
                  ? <span className="band-count">{countdown === 0 ? "▶" : countdown}</span>
                  : <window.IconPlay size={30}/>}
              </button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{countdown !== null ? `${t("room.starting")} ${countdown}…` : t("room.startAll")}</div>
                <div className="muted" style={{ fontSize:12.5, marginTop:3 }}>{t("room.startHint")}</div>
              </div>
            </div>
          ) : (
            <div className="card band-waitcard">
              <span className="band-spinner"><window.IconSpin size={22}/></span>
              <div className="muted" style={{ fontSize:13.5, textAlign:"center" }}>{t("room.waitingLeader")}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ---------- Entrada de invitado (#band/CODE) ---------- */
function GuestJoin({ go, code, onJoin, plan }){
  const { t } = window.useT();
  const [name, setName] = React.useState("");
  const song = window.LIBRARY[0];
  return (
    <main className="wrap app-main page" style={{ maxWidth:520 }}>
      <div className="card" style={{ padding:"clamp(28px,4vw,40px)", marginTop:20 }}>
        <span className="logo-mark" style={{ width:46, height:46, borderRadius:12 }}><window.IconBand size={24} sw={1.6}/></span>
        <span className="eyebrow" style={{ display:"block", marginTop:18 }}>{t("room.eyebrow")} · {code}</span>
        <h1 className="h2" style={{ fontSize:27, marginTop:8 }}>{t("room.joinTitle")}</h1>
        <p className="lead" style={{ fontSize:14.5, marginTop:10, marginBottom:24 }}>{t("room.joinSub")}</p>

        <label className="field-label">{t("room.yourName")}</label>
        <input className="input" value={name} placeholder={t("room.yourNamePh")} onChange={(e) => setName(e.target.value)} autoFocus/>

        <button className="btn btn-primary btn-lg btn-block" style={{ marginTop:20 }}
                disabled={name.trim().length < 2}
                onClick={() => onJoin({ name: name.trim(), code, song })}>
          {t("room.joinAs")} <window.IconArrow size={17}/>
        </button>
        <div className="band-syncnote" style={{ justifyContent:"center" }}><window.IconSpark size={14}/> {t("room.syncNote")}</div>
      </div>
    </main>
  );
}

/* ---------- Router de la sala ---------- */
function BandScreen({ go, plan, library, joinCode, t: tw }){
  const { t } = window.useT();
  const [room, setRoomState] = React.useState(() => loadRoom());
  const setRoom = (updater) => {
    setRoomState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistRoom(next);
      return next;
    });
  };
  window.__tweaks = tw; // para que el player embebido reciba el layout

  const songs = (library && library.length ? library : window.LIBRARY);
  const isGuest = !!joinCode;

  // Plan Banda requerido para CREAR (los invitados entran sin plan).
  if(plan !== "banda" && !isGuest && !room){
    return (
      <main className="wrap app-main page" style={{ maxWidth:560, textAlign:"center" }}>
        <div className="empty">
          <div className="empty-art"><window.IconBand size={38} sw={1.5}/></div>
          <h1 className="h1" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{t("room.bandOnly")}</h1>
          <p className="lead" style={{ margin:"16px auto 0", maxWidth:"42ch" }}>{t("price.forBanda")} · $19.99{t("common.perMonth")}</p>
          <div className="row center gap-12" style={{ marginTop:26 }}>
            <button className="btn btn-ghost" onClick={() => go("dashboard")}>{t("common.back")}</button>
            <button className="btn btn-primary btn-lg" onClick={() => go("profile")}>{t("room.getBanda")}</button>
          </div>
        </div>
      </main>
    );
  }

  // Invitado con código pero sin sala todavía → pantalla de entrada
  if(isGuest && !room){
    return <GuestJoin go={go} code={joinCode} plan={plan}
      onJoin={({ name, code, song }) => {
        setRoom({
          name: song.title, code, song, status:"waiting", startedAt:null, asGuest:true,
          members: [
            { id:"leader_seed", name:"Mariana", instrument:"guitar", ini:"M", color:"#1ed760", ready:true },
            { id:"you_guest", name, instrument:null, ini:name[0].toUpperCase(), color:"#ffffff", ready:false },
          ],
        });
      }}/>;
  }

  // Líder sin sala → crear
  if(!room){
    return <CreateRoom go={go} songs={songs}
      onCreate={({ name, song }) => {
        setRoom({
          name, code: window.makeRoomCode(), song, status:"waiting", startedAt:null, asGuest:false,
          members: [
            { id:"you_leader", name:"Mariana", instrument:"guitar", ini:"M", color:"#1ed760", ready:true, leader:true },
          ],
        });
      }}/>;
  }

  return <ActiveRoom go={go} room={room} setRoom={setRoom} asGuest={!!room.asGuest}/>;
}

Object.assign(window, { BandScreen, loadRoom, persistRoom });
