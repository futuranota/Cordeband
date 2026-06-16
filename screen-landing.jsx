/* screen-landing.jsx — Landing + motion loop del hero + sección de banda */

const GLYPHS = ["♪", "♩", "♫", "♬", "𝄞", "♭"];

function HeroMotion({ mode }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (mode !== "particles") return;
    const cv = canvasRef.current;if (!cv) return;
    const ctx = cv.getContext("2d");
    const acc = getComputedStyle(document.getElementById("app") || document.body).getPropertyValue("--acc").trim() || "#4fb8ff";
    let raf,W,H,dpr = Math.min(2, window.devicePixelRatio || 1);
    const N = 28;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vy: 0.12 + Math.random() * 0.20, vx: (Math.random() - .5) * 0.06,
      g: GLYPHS[Math.random() * GLYPHS.length | 0],
      size: 14 + Math.random() * 26, rot: (Math.random() - .5) * 0.6,
      o: 0.06 + Math.random() * 0.16
    }));
    const resize = () => {
      W = cv.clientWidth;H = cv.clientHeight;
      cv.width = W * dpr;cv.height = H * dpr;ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(50, t - last) / 1000;last = t;
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.y += p.vy * dt * 0.12;p.x += p.vx * dt * 0.12;
        if (p.y > 1.1) {p.y = -0.1;p.x = Math.random();}
        ctx.save();
        ctx.translate(p.x * W, p.y * H);ctx.rotate(p.rot);
        ctx.globalAlpha = p.o;ctx.fillStyle = acc;
        ctx.font = `${p.size}px "Sora", system-ui, sans-serif`;
        ctx.fillText(p.g, 0, 0);
        ctx.restore();
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {cancelAnimationFrame(raf);window.removeEventListener("resize", resize);};
  }, [mode]);

  if (mode === "particles") {
    return <div className="hero-stage"><canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} /></div>;
  }
  if (mode === "pulse") {
    return (
      <div className="hero-stage">
        <div className="stave-bg">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="line" style={{ animationDelay: `${i * 0.5}s` }} />)}
        </div>
        {Array.from({ length: 9 }).map((_, i) => {
          const left = 8 + i * 10.5 % 86;
          return (
            <span key={i} className="float-note" style={{
              left: `${left}%`, top: `${20 + i * 9 % 56}%`,
              fontSize: `${22 + i % 4 * 12}px`, opacity: 0.12 + i % 3 * 0.04,
              animation: `bob ${5 + i % 4}s ease-in-out ${i * 0.4}s infinite`
            }}>{GLYPHS[i % GLYPHS.length]}</span>);

        })}
      </div>);

  }
  return (
    <div className="hero-stage">
      {Array.from({ length: 16 }).map((_, i) => {
        const left = (i * 6.3 + i % 3 * 4) % 96;
        const dur = 11 + i % 5 * 2.2;
        const size = 18 + i % 5 * 11;
        return (
          <span key={i} className="float-note" style={{
            left: `${left}%`, top: 0, fontSize: `${size}px`,
            "--o": 0.10 + i % 4 * 0.04,
            "--r": `${(i % 2 ? -1 : 1) * (8 + i * 3)}deg`,
            animation: `floatDown ${dur}s linear ${i * 0.9 % 6}s infinite`
          }}>{GLYPHS[i % GLYPHS.length]}</span>);

      })}
    </div>);

}

function DemoStaff() {
  const lines = [0, 1, 2, 3, 4];
  const notes = [
  { x: 42, y: 64 }, { x: 74, y: 52 }, { x: 104, y: 40 }, { x: 138, y: 58 },
  { x: 176, y: 46 }, { x: 212, y: 64 }, { x: 250, y: 34 }, { x: 286, y: 52 }, { x: 322, y: 58 }];

  return (
    <svg viewBox="0 0 360 150" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      {lines.map((i) => <line key={i} x1="14" x2="346" y1={40 + i * 15} y2={40 + i * 15} stroke="rgba(255,255,255,0.13)" strokeWidth="1" />)}
      <text x="20" y="74" fontFamily="Georgia, serif" fontSize="40" fill="#cfcfcf" opacity="0.85">𝄞</text>
      {notes.map((n, i) =>
      <g key={i}>
          <ellipse cx={n.x} cy={n.y} rx="6.4" ry="4.8" fill="#cfcfcf" transform={`rotate(-18 ${n.x} ${n.y})`} />
          <line x1={n.x + 6} x2={n.x + 6} y1={n.y} y2={n.y - 26} stroke="#cfcfcf" strokeWidth="1.4" />
        </g>
      )}
      <line x1="150" x2="150" y1="24" y2="126" style={{ stroke: "rgb(142, 173, 210)" }} strokeWidth="2" />
      <circle cx="150" cy="24" r="4" style={{ fill: "rgb(204, 249, 255)" }} />
    </svg>);

}

function HeroDemo() {
  const { t } = window.useT();
  return (
    <div className="card demo-card" style={{ borderRadius: "16px", height: "280px", backgroundColor: "rgb(0, 0, 0)", width: "320px" }}>
      <div className="row spread" style={{ marginBottom: 14, alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="acc-text" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 700, color: "rgb(161, 161, 161)" }}>{t("hero.nowPlaying")}</div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, marginTop: 5, lineHeight: 1.15, color: "#fff" }}>{t("hero.demoSong")}</div>
        </div>
        <span className="muted-tag" style={{ flex: "0 0 auto", color: "rgb(255, 255, 255)" }}><span className="dot"></span>{t("hero.demoTag")}</span>
      </div>
      <div className="demo-staff"><DemoStaff /></div>
      <div className="demo-bar">
        <span className="play-btn" style={{ width: 42, height: 42, backgroundColor: "rgb(32, 157, 215)" }}><window.IconPause size={16} /></span>
        <div className="demo-progress"><i style={{ backgroundColor: "rgb(32, 157, 215)" }} /></div>
        <span className="muted tnum" style={{ fontSize: 12 }}>1:34</span>
      </div>
    </div>);

}

function StepCard({ n, title, body, Icon }) {
  return (
    <div className="card step">
      <div className="row spread" style={{ color: "rgb(175, 36, 36)" }}>
        <div className="step-n">{n}</div>
        <span style={{ color: "var(--acc)" }}><Icon size={22} /></span>
      </div>
      <h3 className="h3">{title}</h3>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>{body}</p>
    </div>);

}

function PriceCard({ tier, go }) {
  const { t } = window.useT();
  const D = {
    free: { label: t("common.free"), amount: "$0", per: false, feats: t("price.freeFeat"), forr: t("price.forFree"), cta: t("price.ctaFree"), btn: "btn-ghost" },
    pro: { label: "BASIC", amount: "$9.99", per: true, feats: t("price.proFeat"), forr: t("price.forPro"), cta: t("price.ctaPro"), btn: "btn-primary" },
    banda: { label: t("common.banda"), amount: "$19.99", per: true, feats: t("price.bandaFeat"), forr: t("price.forBanda"), cta: t("price.ctaBanda"), btn: "btn-white" }
  };
  const d = D[tier];
  const hot = tier === "banda";
  return (
    <div className={"card price" + (hot ? " pro" : "")} style={{ ...(hot ? null : { borderColor: "rgba(0, 0, 0, 0.44)" }), borderColor: "rgba(69, 9, 9, 0.44)" }}>
      {hot && <span className="price-pop"><window.IconSpark size={12} /> {t("price.popular")}</span>}
      <div className="row spread" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow" style={{ color: "rgb(255, 255, 255)" }}>{d.label}</div>
          <div className="row" style={{ alignItems: "flex-end", gap: 6, marginTop: 10 }}>
            <span className="amount">{d.amount}</span>
            {d.per && <span style={{ marginBottom: 8, color: "var(--text-3)", fontSize: 14 }}>{t("common.perMonth")}</span>}
          </div>
          <div className="price-for">{d.forr}</div>
        </div>
        {tier === "pro" && <span className="badge-pro" style={{ backgroundColor: "rgb(255, 255, 255)" }}><window.IconCrown size={12} sw={1.8} /> BASIC</span>}
        {tier === "banda" && <span className="badge-pro badge-band"><window.IconBand size={12} sw={1.8} /> Banda</span>}
      </div>
      <ul>
        {d.feats.map((f, i) => <li key={i}><window.IconCheck size={16} sw={2} /> {f}</li>)}
      </ul>
      <div className="price-cta">
        <button className={"btn btn-block " + d.btn} onClick={() => go("signup")} style={{ borderWidth: "2px", borderColor: "rgba(131, 131, 131, 0)", backgroundColor: "rgba(255, 255, 255, 0)", color: "rgb(255, 255, 255)" }}>{tier === "pro" ? <span style={{ color: "#ffffff" }}>{d.cta}</span> : d.cta}</button>
      </div>
    </div>);

}

/* ---------- Sección: comparte con tu banda ---------- */
function BandShareSection({ go }) {
  const { t } = window.useT();
  const [copied, setCopied] = React.useState(false);
  const [claimed, setClaimed] = React.useState({ piano: false });

  const copy = () => {
    const url = "cordeband.app/s/las-luces-de-enero";
    try {navigator.clipboard && navigator.clipboard.writeText(url);} catch (e) {}
    setCopied(true);setTimeout(() => setCopied(false), 1800);
  };

  const roster = [
  { key: "guitar", name: t("band.m1"), taken: true, ini: "M", col: "#1ed760" },
  { key: "drums", name: t("band.m2"), taken: true, ini: "D", col: "#4d9fff" },
  { key: "bass", name: t("band.m3"), taken: true, ini: "S", col: "#e0a92b" },
  { key: "piano", name: claimed.piano ? t("band.you") : "", taken: claimed.piano, ini: t("band.you")[0], col: "#fff" },
  { key: "vocals", name: "", taken: false, ini: "?", col: "#fff" }];


  return (
    <section className="section bandshare" id="band">
      <div className="wrap">
        <div className="bandshare-grid">
          <div>
            <span className="eyebrow" style={{ color: "rgb(204, 249, 255)" }}>{t("band.eyebrow")}</span>
            <h2 className="h2" style={{ marginTop: 14 }}>{t("band.title")}</h2>
            <p className="lead" style={{ marginTop: 18 }}>{t("band.sub")}</p>
            <div className="hero-cta" style={{ marginTop: 28 }}>
              <button className="btn btn-primary btn-lg" onClick={() => go("signup")} style={{ backgroundColor: "rgb(204, 249, 255)" }}>
                {t("band.cta")} <window.IconArrow size={17} />
              </button>
            </div>
            <div className="hero-trust" style={{ marginTop: 18 }}>
              <window.IconCheck size={15} sw={2} /> {t("band.note")}
            </div>
          </div>

          <div className="share-card">
            <label className="field-label">{t("band.linkLabel")}</label>
            <div className="share-link">
              <window.IconLoop size={15} style={{ color: "var(--acc)", flex: "0 0 auto" }} />
              <span className="url">cordeband.app/s/las-luces-de-enero</span>
              <button className="btn btn-primary btn-sm" onClick={copy} style={{ backgroundColor: "rgb(204, 249, 255)" }}>
                {copied ? t("band.copied") : t("band.copy")}
              </button>
            </div>

            <div className="share-roster">
              <div className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 2 }}>{t("band.rosterTitle")}</div>
              {roster.map((r) => {
                const inst = window.INSTRUMENTS[r.key];const Icon = inst.Icon;
                const canClaim = r.key === "piano" && !claimed.piano;
                return (
                  <div key={r.key} className={"roster-row" + (r.taken ? " taken" : "")}>
                    <span className="r-ico"><Icon size={17} sw={1.5} /></span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="r-name">{t("inst." + r.key)}</div>
                      <div className="r-inst">{r.taken ? r.name : t("band.open")}</div>
                    </div>
                    {r.taken ?
                    <span className="roster-row r-ava" style={{ background: r.col, color: "#0a0a0a", border: "none" }}>{r.ini}</span> :
                    canClaim ?
                    <button className="chip-btn" onClick={() => setClaimed({ piano: true })}>{t("band.open")}</button> :

                    <span className="roster-tag open">{t("band.open")}</span>
                    }
                  </div>);

              })}
            </div>
          </div>
        </div>
      </div>
    </section>);

}

function LandingScreen({ go, t: tw }) {
  const { t } = window.useT();
  return (
    <div className="page">
      <header className="hero">
        <HeroMotion mode={tw.heroMotion} />
        <div className="wrap hero-inner">
          <div className="hero-grid">
            <div>
              <span className="pill hero-eyebrow" style={{ fontWeight: "500", color: "rgb(136, 136, 136)" }}><window.IconSpark size={13} /> {t("hero.badge")}</span>
              <h1 className="h1" style={{ color: "rgb(255, 255, 255)", fontSize: "48px" }}>{t("hero.t1")}<span className="ink-em" style={{ color: "rgb(252, 252, 252)" }}>{t("hero.em")}</span>{t("hero.t2")}</h1>
              <p className="lead hero-sub" style={{ fontSize: "15px" }}>{t("hero.sub")}</p>
              <div className="hero-cta">
                <button className="btn btn-primary btn-lg" onClick={() => go("signup")} style={{ color: "#fff", backgroundColor: "rgb(32, 157, 215)" }}>
                  {t("hero.ctaStart")} <window.IconArrow size={17} />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => go("player")}>{t("hero.ctaDemo")}</button>
              </div>
              <div className="hero-trust">
                <window.IconCheck size={15} sw={2} /> {t("hero.trust")}
              </div>
            </div>
            <div className="hero-visual">
              <img className="hero-guitar" src="assets/guitar-black.png" alt="Guitarra eléctrica negra" />
              <div className="hero-demo-float"><HeroDemo /></div>
            </div>
          </div>
        </div>
      </header>

      <section className="wrap section" id="features">
        <div className="section-head">
          <span className="eyebrow">{t("how.eyebrow")}</span>
          <h2 className="h2" style={{ marginTop: 14 }}>{t("how.title")}</h2>
        </div>
        <div className="steps">
          <StepCard n="1" Icon={window.IconUpload} title={t("how.s1t")} body={t("how.s1b")} />
          <StepCard n="2" Icon={window.InstGuitar} title={t("how.s2t")} body={t("how.s2b")} />
          <StepCard n="3" Icon={window.IconNote} title={t("how.s3t")} body={t("how.s3b")} />
        </div>
      </section>

      <BandShareSection go={go} />

      <section className="wrap section-tight" id="instruments">
        <div className="row spread" style={{ flexWrap: "wrap", gap: 24, alignItems: "flex-end" }}>
          <div className="section-head">
            <span className="eyebrow">{t("instSec.eyebrow")}</span>
            <h2 className="h2" style={{ marginTop: 14 }}>{t("instSec.title")}</h2>
          </div>
          <div className="inst-strip">
            {window.INST_ORDER.map((k) => {
              const inst = window.INSTRUMENTS[k];const Icon = inst.Icon;
              return <span key={k} className="pill" style={{ padding: "9px 14px" }}><Icon size={15} sw={1.5} /> {t("inst." + k)}</span>;
            })}
          </div>
        </div>
      </section>

      <section className="wrap section" id="pricing">
        <div className="section-head">
          <span className="eyebrow">{t("price.eyebrow")}</span>
          <h2 className="h2" style={{ marginTop: 14 }}>{t("price.title")}</h2>
        </div>
        <div className="price-grid">
          <PriceCard tier="free" go={go} />
          <PriceCard tier="pro" go={go} />
          <PriceCard tier="banda" go={go} />
        </div>
      </section>

      <TestimonialSection />

      <window.Footer />
    </div>);

}

const TESTIMONIALS = [
  { quote: "Cordeband cambió por completo cómo practico con mi banda. Subimos la canción, cada quien elige su instrumento y listo — sin mezclas raras ni MP3 cortados a mano. Es exactamente lo que necesitábamos.", name: "Sofía R.", role: "Guitarrista, Madrid" },
  { quote: "Llevo años buscando algo así. La partitura sincronizada con el audio es una pasada; ya no pierdo el compás aunque esté tocando solo. El modo banda es lo mejor para los ensayos a distancia.", name: "Carlos M.", role: "Bajista, Ciudad de México" },
  { quote: "Usamos Cordeband para preparar conciertos escolares. En minutos tenemos las pistas separadas para cada alumno. Les encanta poder practicar su parte sin escuchar a los demás instrumentos encima.", name: "Ana P.", role: "Profesora de música, Buenos Aires" },
];

function TestimonialSection() {
  return (
    <section className="wrap section" id="testimonials">
      <div className="section-head">
        <span className="eyebrow">Músicos que ya practican con Cordeband</span>
        <h2 className="h2" style={{ marginTop: 14 }}>Lo que dicen nuestros usuarios</h2>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginTop:40 }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="card" style={{ padding:"28px 28px 24px", borderLeft:"3px solid var(--acc)", display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontSize:15, lineHeight:1.65, color:"var(--text-2)", margin:0 }}>"{t.quote}"</p>
            <footer style={{ display:"flex", alignItems:"center", gap:10, marginTop:"auto" }}>
              <span style={{ width:34, height:34, borderRadius:"50%", background:"var(--acc-soft)", border:"1px solid var(--acc-line)", display:"grid", placeItems:"center", fontSize:15, fontWeight:700, color:"var(--acc)" }}>
                {t.name[0]}
              </span>
              <div>
                <div style={{ fontWeight:700, fontSize:13.5, color:"#fff" }}>{t.name}</div>
                <div style={{ fontSize:12, color:"var(--text-4)" }}>{t.role}</div>
              </div>
            </footer>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { LandingScreen });