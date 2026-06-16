/* screen-dashboard.jsx — Biblioteca personal + estado de stems (TTL 48h) */

/* Cuenta regresiva de stems — la partitura es permanente; los stems duran 48h. */
function useStemsTick(){
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => force(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
}

function StemsStatus({ song, compact }){
  const { t } = window.useT();
  useStemsTick();
  const ms = window.stemsMsLeft(song);
  if(ms <= 0){
    return (
      <span className="stems-pill expired">
        <window.IconClock size={12}/> {t("dash.stemsExpired")}
      </span>
    );
  }
  const hours = ms / 3600000;
  let value;
  if(hours >= 1){
    const h = Math.floor(hours);
    value = `${h} ${h === 1 ? t("dash.hour") : t("dash.hours")}`;
  } else {
    value = `${Math.max(1, Math.round(hours * 60))} ${t("dash.minutes")}`;
  }
  const low = hours < 6;
  return (
    <span className={"stems-pill" + (low ? " low" : "")}>
      <window.IconClock size={12}/> {t("dash.stemsFor")} {value} {t("dash.more")}
    </span>
  );
}

function SongCard({ song, onOpen }){
  const { t } = window.useT();
  useStemsTick();
  const expired = window.stemsExpired(song);
  return (
    <div className={"card song-card" + (expired ? " expired" : "")} onClick={() => onOpen(song)}>
      <div className="song-cover">
        <span className="cover-glyph">{song.glyph}</span>
        {expired
          ? <span className="cover-tag warn"><window.IconUpload size={11}/> {t("dash.stemsExpired")}</span>
          : <span className="cover-tag">{t("dash.eyebrow")}</span>}
        {expired && (
          <div className="cover-regen">
            <span className="regen-ico"><window.IconReset size={20}/></span>
          </div>
        )}
      </div>
      <div className="song-body">
        <div>
          <div className="song-title serif">{song.title}</div>
          <div className="song-artist">{song.artist}</div>
        </div>
        <div className="song-insts">
          {song.instruments.slice(0,4).map(k => {
            const inst = window.INSTRUMENTS[k]; const Icon = inst.Icon;
            return <span key={k} className="pill" style={{ padding:"4px 9px", fontSize:11 }}><Icon size={12} sw={1.5}/> {t("inst."+k)}</span>;
          })}
        </div>
        <div className="song-foot">
          <StemsStatus song={song}/>
          {expired && (
            <button className="btn btn-primary btn-sm song-cta" onClick={(e) => { e.stopPropagation(); onOpen(song); }}>
              <window.IconUpload size={14}/> {t("dash.reactivateShort")}
            </button>
          )}
        </div>
        <div className="song-scoresafe"><window.IconCheck size={12} sw={2.2}/> {t("dash.scoreSafe")}</div>
      </div>
    </div>
  );
}

function EmptyLibrary({ go }){
  const { t } = window.useT();
  return (
    <div className="empty page">
      <div className="empty-art"><window.IconNote size={40} sw={1.4}/></div>
      <h1 className="h1" style={{ fontSize:"clamp(30px,4vw,42px)" }}>{t("dash.emptyTitle")}</h1>
      <p className="lead" style={{ margin:"18px auto 0", maxWidth:"46ch" }}>{t("dash.emptySub")}</p>
      <div className="row center gap-12" style={{ marginTop:30 }}>
        <button className="btn btn-primary btn-lg" onClick={() => go("upload")}>
          <window.IconPlus size={16}/> {t("dash.uploadFirst")}
        </button>
      </div>
      <div className="row center gap-24" style={{ marginTop:34, color:"var(--text-4)", fontSize:13 }}>
        <span className="row gap-8"><window.IconUpload size={15}/> {t("dash.formats")}</span>
        <span className="row gap-8"><window.IconClock size={15}/> {t("dash.readyIn")}</span>
      </div>
    </div>
  );
}

function DashboardScreen({ go, library, plan, planLimit, used, onOpen, onAddAttempt, onOpenFeatured }){
  const { t } = window.useT();
  const featured = window.publishedFeatured();
  const isBanda = plan === "banda";
  const unlimited = plan !== "free";

  if(library.length === 0 && featured.length === 0){
    return <EmptyLibrary go={go}/>;
  }

  const u = used != null ? used : 0;
  const pct = unlimited ? 100 : Math.min(100, (u/planLimit)*100);
  const left = Math.max(0, planLimit-u);
  return (
    <main className="wrap app-main page">
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("dash.eyebrow")}</span>
          <h1 className="h1">{t("dash.title")}</h1>
        </div>
        <div className="col gap-12" style={{ alignItems:"flex-end" }}>
          {unlimited ? (
            <span className="pill">{isBanda
              ? <><window.IconBand size={13}/> {t("common.banda")}</>
              : <><window.IconCrown size={13}/> {t("dash.unlimited")}</>}</span>
          ) : (
            <div className="plan-meter">
              <span className="muted tnum" style={{ fontSize:13 }}>{u} {t("dash.thisMonth")} {planLimit} {t("dash.thisMonth2")}</span>
              <div className="meter"><i style={{ width:`${pct}%` }}/></div>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAddAttempt}>
            <window.IconPlus size={15}/> {t("dash.add")}
          </button>
        </div>
      </div>

      {library.length > 0 ? (
        <div className="song-grid">
          {library.map(s => <SongCard key={s.id} song={s} onOpen={onOpen}/>)}
          <div className="card add-card song-card" onClick={onAddAttempt}>
            <div className="plus"><window.IconPlus size={22}/></div>
            <div style={{ fontWeight:600 }}>{t("dash.add")}</div>
            <div className="muted" style={{ fontSize:12.5 }}>
              {unlimited ? t("dash.noLimit") : `${left} ${left===1?t("dash.newThisMonth"):t("dash.newThisMonth2")}`}
            </div>
          </div>
        </div>
      ) : (
        <div className="card bands-empty" style={{ padding:24 }}>
          <span className="empty-ico"><window.IconUpload size={20}/></span>
          <div className="grow">
            <div style={{ fontWeight:700, fontSize:15 }}>{t("dash.emptyTitle")}</div>
            <div className="muted" style={{ fontSize:13, marginTop:3 }}>{t("dash.emptySub")}</div>
          </div>
          <button className="btn btn-primary" onClick={onAddAttempt}><window.IconPlus size={15}/> {t("dash.uploadFirst")}</button>
        </div>
      )}

      {isBanda && <BandsSection go={go}/>}

      {featured.length > 0 && <FeaturedSection items={featured} onOpen={onOpenFeatured}/>}
    </main>
  );
}

/* ---------- Canciones destacadas (is_featured del admin) ---------- */
function FeaturedSongCard({ song, onOpen }){
  const { t } = window.useT();
  return (
    <div className="card feat-card" onClick={() => onOpen(song)}>
      <div className="feat-cover">
        <span className="feat-badge"><window.IconSpark size={11}/> {t("dash.featBadge")}</span>
        <span className="feat-glyph">{song.glyph}</span>
        <span className="feat-play"><window.IconPlay size={16}/></span>
      </div>
      <div className="feat-body">
        <div className="feat-title">{song.title}</div>
        <div className="feat-artist">{song.artist}</div>
        <div className="feat-meta">
          <span>{song.bpm} BPM</span><span style={{ opacity:.4 }}>·</span><span>{song.keySig}</span>
          <span className="feat-insts">
            {song.instruments.slice(0,4).map(k => { const Ic = window.INSTRUMENTS[k].Icon; return <Ic key={k} size={13} sw={1.5}/>; })}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturedSection({ items, onOpen }){
  const { t } = window.useT();
  return (
    <section className="dash-section">
      <div className="dash-sec-head">
        <div className="row gap-12">
          <span className="dash-sec-icon"><window.IconSpark size={16}/></span>
          <div>
            <div className="dash-sec-title">{t("dash.featTitle")}</div>
            <div className="dash-sec-sub">{t("dash.featSub")}</div>
          </div>
        </div>
      </div>
      <div className="feat-grid">
        {items.map(s => <FeaturedSongCard key={s.id} song={s} onOpen={onOpen}/>)}
      </div>
    </section>
  );
}

/* ---------- Mis bandas (Plan Banda) ---------- */
function BandsSection({ go }){
  const { t } = window.useT();
  const room = window.loadRoom && window.loadRoom();
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const join = () => {
    const c = code.trim().toUpperCase();
    if(c.length < 3) return;
    location.hash = "#band/" + c;
    location.reload();
  };
  const playing = room && room.status === "playing";
  return (
    <section className="dash-section">
      <div className="dash-sec-head">
        <div className="row gap-12">
          <span className="dash-sec-icon"><window.IconBand size={16}/></span>
          <div>
            <div className="dash-sec-title">{t("dash.bandsTitle")}</div>
            <div className="dash-sec-sub">{t("dash.bandsSub")}</div>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => go("band")}><window.IconPlus size={15}/> {t("dash.createRoom")}</button>
      </div>

      {room ? (
        <div className="bands-list">
          <div className="card band-room">
            <span className="band-room-glyph">{room.song.glyph}</span>
            <div className="band-room-info">
              <div className="band-room-name">{room.name}</div>
              <div className="band-room-meta">
                <span>{room.song.title}</span><span style={{ opacity:.4 }}>·</span>
                <span className={"band-room-state" + (playing?" playing":"")}>
                  {playing ? <span className="ping"/> : <span className="band-dot"/>}
                  {playing ? t("dash.roomPlaying") : t("dash.roomWaiting")}
                </span>
                <span>{room.members.length} {t("dash.roomMembers")}</span>
                <span className="pill pill-ink" style={{ padding:"3px 9px", fontSize:11 }}>{room.code}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => go("band")}>{t("dash.openRoom")}</button>
          </div>
        </div>
      ) : (
        <div className="card bands-empty">
          <span className="empty-ico"><window.IconBand size={20}/></span>
          <div className="grow">
            <div style={{ fontWeight:700, fontSize:14.5 }}>{t("dash.bandsEmpty")}</div>
            <div className="muted" style={{ fontSize:13, marginTop:3 }}>{t("dash.bandsSub")}</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => go("band")}><window.IconPlus size={15}/> {t("dash.createRoom")}</button>
        </div>
      )}

      {!joinOpen ? (
        <button className="btn btn-ghost btn-sm" style={{ marginTop:14 }} onClick={() => setJoinOpen(true)}>
          <window.IconArrow size={14}/> {t("dash.joinRoom")}
        </button>
      ) : (
        <div className="bands-join">
          <input className="input" value={code} placeholder="BND-X4K" onChange={(e) => setCode(e.target.value)} autoFocus/>
          <button className="btn btn-primary" onClick={join} disabled={code.trim().length<3}>{t("room.joinGo")}</button>
        </div>
      )}
    </section>
  );
}

Object.assign(window, { DashboardScreen, SongCard, StemsStatus, FeaturedSongCard, FeaturedSection, BandsSection });
