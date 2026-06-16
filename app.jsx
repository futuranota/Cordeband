/* app.jsx — Router, estado global, idioma y Tweaks */

const { useState, useEffect } = React;

const FONT_STACK = {
  "Sora": "'Sora', 'Manrope', system-ui, sans-serif",
  "Manrope": "'Manrope', system-ui, sans-serif",
  "Montserrat": "'Montserrat', 'Manrope', system-ui, sans-serif",
};
const DENSITY = { compact: 0.84, comodo: 1, amplio: 1.16 };

const ACCENTS = {
  green: { acc:"#1ed760", press:"#1fdf64", ink:"#0a0a0a", soft:"rgba(30,215,96,0.14)",  line:"rgba(30,215,96,0.42)" },
  blue:  { acc:"#4fb8ff", press:"#2ea3f2", ink:"#04121f", soft:"rgba(79,184,255,0.14)", line:"rgba(79,184,255,0.40)" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "headlineFont": "Sora",
  "density": "comodo",
  "radius": 12,
  "playerLayout": "side",
  "heroMotion": "particles"
}/*EDITMODE-END*/;

const LS_KEY = "cordeband_state_v1";
function loadState(){
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){ return {}; }
}

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const saved = React.useRef(loadState()).current;

  // Idioma: ES por defecto, opción EN siempre disponible.
  const [lang, setLang] = useState(saved.lang || "es");

  // Logo → index.html#home fuerza el landing al cargar.
  const forceHome = typeof location !== "undefined" && location.hash === "#home";
  // Portal de admin: index.html#admin (o ruta /admin).
  const adminUrl = typeof location !== "undefined" &&
    (/#\/?admin\/?$/.test(location.hash) || /\/admin\/?$/.test(location.pathname));
  // Invitado a sala de banda: index.html#band/CODE
  const bandMatch = typeof location !== "undefined" && location.hash.match(/#\/?band\/([A-Za-z0-9-]+)/);
  const joinCode = bandMatch ? bandMatch[1].toUpperCase() : null;
  useEffect(() => {
    if(forceHome){ history.replaceState(null, "", location.pathname + location.search); }
  }, []);

  const [route, setRoute] = useState(
    adminUrl ? "admin" : joinCode ? "band" : (forceHome ? "landing" : (saved.route || "landing")));
  const [authed, setAuthed] = useState(!!saved.authed);
  const [plan, setPlan] = useState(saved.plan || "free");
  const [library, setLibrary] = useState(() => {
    if(Array.isArray(saved.library)) return saved.library;
    return window.LIBRARY.slice(0,2);
  });
  const [activeSong, setActiveSong] = useState(() =>
    saved.songId ? null : null);
  const [regenSong, setRegenSong] = useState(null);
  const [instrument, setInstrument] = useState(saved.instrument || null);
  const [lastInstrument, setLastInstrument] = useState(saved.instrument || "guitar");
  const [showLimit, setShowLimit] = useState(false);
  const planLimit = 1;
  const usedThisMonth = library.filter(s => s.addedThisMonth).length;

  useEffect(() => {
    const data = { route: route==="admin"?"dashboard":route, plan, lang, authed, instrument, songId: activeSong?.id || null, library };
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e){}
  }, [route, plan, lang, authed, instrument, activeSong, library]);

  const go = (r, anchor) => {
    setRoute(r);
    requestAnimationFrame(() => {
      if(anchor){ const el = document.getElementById(anchor); if(el) window.scrollTo({ top: el.offsetTop - 80, behavior:"smooth" }); }
      else window.scrollTo({ top:0, behavior:"auto" });
    });
  };

  const openSong = (song) => {
    setActiveSong(song);
    if(window.stemsExpired(song)){ setRegenSong(song); go("upload"); }
    else go("instrument");
  };
  const chooseInstrument = (k) => { setInstrument(k); setLastInstrument(k); go("player"); };
  const onAddAttempt = () => {
    if(plan === "free" && usedThisMonth >= planLimit){ setShowLimit(true); }
    else { setRegenSong(null); go("upload"); }
  };
  const TTL = 48 * 3600 * 1000;
  const onUploadComplete = (song) => {
    if(regenSong){
      const refreshed = { ...regenSong, stemsExpiresAt: Date.now() + TTL };
      setLibrary(prev => prev.map(s => s.id===regenSong.id ? refreshed : s));
      setActiveSong(refreshed); setRegenSong(null); go("instrument");
      return;
    }
    const withMeta = { ...song, stemsExpiresAt: Date.now() + TTL, addedThisMonth:true };
    setLibrary(prev => [withMeta, ...prev]);
    setActiveSong(withMeta);
    go("instrument");
  };
  const exitUpload = () => { setRegenSong(null); go("dashboard"); };
  const resetDemo = () => { setLibrary([]); setActiveSong(null); setInstrument(null); window.persistRoom && window.persistRoom(null); go("dashboard"); };
  const upgrade = (toPlan) => { setPlan(toPlan || "pro"); setShowLimit(false); };
  const completeAuth = () => { setAuthed(true); go("dashboard"); };
  const openFeatured = (song) => { setActiveSong({ ...song, stemsExpiresAt:null }); go("instrument"); };

  const A = ACCENTS[t.accent] || ACCENTS.green;
  const wrapStyle = {
    "--radius": t.radius + "px",
    "--radius-sm": Math.max(6, t.radius - 4) + "px",
    "--d": DENSITY[t.density] || 1,
    "--display": FONT_STACK[t.headlineFont] || FONT_STACK["Sora"],
    "--acc": A.acc, "--acc-press": A.press, "--acc-ink": A.ink,
    "--acc-soft": A.soft, "--acc-line": A.line,
  };

  const isLandingNav = route === "landing" || route === "signup" || route === "login";

  // Portal de admin: pantalla completa, sin la navegación del sitio.
  if(route === "admin"){
    return (
      <window.LangProvider lang={lang} setLang={setLang}>
        <div id="app" style={wrapStyle}>
          <window.AdminScreen go={go} lang={lang} setLang={setLang}/>
        </div>
      </window.LangProvider>
    );
  }

  return (
    <window.LangProvider lang={lang} setLang={setLang}>
      <div id="app" style={wrapStyle}>
        {isLandingNav
          ? <window.LandingNav go={go}/>
          : <window.AppNav route={route} go={go} plan={plan} onReset={resetDemo}/>}

        {route === "landing"   && <window.LandingScreen go={go} t={t}/>}
        {(route === "signup" || route === "login") &&
          <window.SignupScreen go={go} mode={route} onComplete={completeAuth}/>}
        {route === "dashboard" && <window.DashboardScreen go={go} library={library} plan={plan}
                                    planLimit={planLimit} used={usedThisMonth} onOpen={openSong}
                                    onAddAttempt={onAddAttempt} onOpenFeatured={openFeatured}/>}
        {route === "band"      && <window.BandScreen go={go} plan={plan} library={library}
                                    joinCode={joinCode} t={t}/>}
        {route === "upload"    && <window.UploadScreen go={go} onComplete={onUploadComplete}
                                    regenSong={regenSong} onExit={exitUpload}/>}
        {route === "instrument"&& <window.InstrumentScreen go={go} song={activeSong || library[0] || window.LIBRARY[0]}
                                    lastInstrument={lastInstrument} onChoose={chooseInstrument}/>}
        {route === "player"    && <window.PlayerScreen go={go} song={activeSong || library[0] || window.LIBRARY[0]}
                                    instrument={instrument || "guitar"} t={t} authed={authed}/>}
        {route === "profile"   && <window.ProfileScreen go={go} plan={plan} planLimit={planLimit}
                                    used={usedThisMonth} onUpgrade={upgrade} onDowngrade={() => setPlan("free")}/>}

        {showLimit && <window.LimitModal onClose={() => setShowLimit(false)}
                        onUpgrade={() => { upgrade(); go("profile"); }}/>}

        <Tweaks t={t} setTweak={setTweak} lang={lang} setLang={setLang}/>
      </div>
    </window.LangProvider>
  );
}

/* Panel de Tweaks — usa el idioma actual para las etiquetas */
function Tweaks({ t, setTweak, lang, setLang }){
  const es = lang === "es";
  const L = es
    ? { brand:"Marca", lang:"Idioma", accent:"Acento", font:"Titulares",
        layout:"Layout", density:"Densidad", radius:"Radio de bordes",
        player:"Reproductor", aff:"Recomendados", hero:"Hero", motion:"Animación",
        dCompact:"Compacto", dComodo:"Cómodo", dAmplio:"Amplio",
        side:"Lateral", bottom:"Inferior", falling:"Cayendo", pulse:"Pulso", particles:"Partículas" }
    : { brand:"Brand", lang:"Language", accent:"Accent", font:"Headings",
        layout:"Layout", density:"Density", radius:"Corner radius",
        player:"Player", aff:"Recommended", hero:"Hero", motion:"Motion",
        dCompact:"Compact", dComodo:"Cozy", dAmplio:"Roomy",
        side:"Side", bottom:"Bottom", falling:"Falling", pulse:"Pulse", particles:"Particles" };
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label={L.brand} />
      <TweakRadio label={L.lang} value={lang}
        options={[{value:"es",label:"Español"},{value:"en",label:"English"}]}
        onChange={(v) => setLang(v)} />
      <TweakColor label={L.accent} value={ACCENTS[t.accent].acc}
        options={[ACCENTS.green.acc, ACCENTS.blue.acc]}
        onChange={(hex) => setTweak("accent", hex === ACCENTS.blue.acc ? "blue" : "green")} />
      <TweakSelect label={L.font} value={t.headlineFont}
        options={["Sora","Manrope","Montserrat"]}
        onChange={(v) => setTweak("headlineFont", v)} />

      <TweakSection label={L.layout} />
      <TweakRadio label={L.density} value={t.density}
        options={[{value:"compact",label:L.dCompact},{value:"comodo",label:L.dComodo},{value:"amplio",label:L.dAmplio}]}
        onChange={(v) => setTweak("density", v)} />
      <TweakSlider label={L.radius} value={t.radius} min={4} max={18} step={1} unit="px"
        onChange={(v) => setTweak("radius", v)} />
      <TweakRadio label={L.aff} value={t.playerLayout}
        options={[{value:"side",label:L.side},{value:"bottom",label:L.bottom}]}
        onChange={(v) => setTweak("playerLayout", v)} />

      <TweakSection label={L.hero} />
      <TweakRadio label={L.motion} value={t.heroMotion}
        options={[{value:"falling",label:L.falling},{value:"pulse",label:L.pulse},{value:"particles",label:L.particles}]}
        onChange={(v) => setTweak("heroMotion", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
