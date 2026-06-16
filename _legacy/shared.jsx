/* shared.jsx — logo Cordeband, navegación, footer, menú de cuenta */

const { useState, useRef, useEffect } = React;

function Brandmark() {
  return (
    <img src="assets/Corderband-logo.svg" alt="Cordeband" style={{ width:24, height:24, display:"block" }} />
  );
}

/* El logo lleva a index.html (#home fuerza el landing al cargar). */
function Logo() {
  return (
    <a className="logo" href="index.html#home" aria-label="Cordeband — inicio">
      <Brandmark />
      <span className="logo-word">Cordeband</span>
    </a>);

}

/* ---------- Nav del landing (no autenticado) ---------- */
function LandingNav({ go }) {
  const { t } = window.useT();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <button className="nav-link" onClick={() => go("landing", "features")}>{t("nav.how")}</button>
          <button className="nav-link" onClick={() => go("landing", "pricing")}>{t("nav.pricing")}</button>
          <button className="nav-link" onClick={() => go("landing", "band")}>{t("nav.band")}</button>
          <button className="nav-link" onClick={() => go("landing", "instruments")}>{t("nav.instruments")}</button>
        </div>
        <div className="row gap-12">
          <window.LangToggle />
          <button className="btn btn-ghost btn-sm" onClick={() => go("login")}>{t("nav.login")}</button>
          <button className="btn btn-primary btn-sm" onClick={() => go("signup")} style={{ backgroundColor: "rgb(32, 157, 215)", color: "#fff" }}>{t("nav.start")}</button>
        </div>
      </div>
    </nav>);

}

/* ---------- Nav de la app (autenticado) ---------- */
function AppNav({ route, go, plan, onReset }) {
  const { t } = window.useT();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) setMenu(false);};
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const is = (r) => route === r;
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <button className={"nav-link" + (is("dashboard") ? " active" : "")} onClick={() => go("dashboard")}>{t("nav.library")}</button>
          <button className={"nav-link" + (is("player") || is("instrument") ? " active" : "")} onClick={() => go("dashboard")}>{t("nav.practice")}</button>
          <button className={"nav-link" + (is("band") ? " active" : "")} onClick={() => go("band")}>{t("nav.band")}</button>
          <button className={"nav-link" + (is("profile") ? " active" : "")} onClick={() => go("profile")}>{t("nav.subscription")}</button>
        </div>
        <div className="row gap-12" ref={ref} style={{ position: "relative" }}>
          <window.LangToggle />
          {plan === "banda" ?
          <span className="badge-pro badge-band"><window.IconBand size={12} sw={1.8} /> Banda</span> :
          plan === "pro" ?
          <span className="badge-pro"><window.IconCrown size={12} sw={1.8} /> Pro</span> :
          <button className="pill pill-ghost" onClick={() => go("profile")}>{t("nav.freePlan")}</button>}
          <button className="btn btn-primary btn-sm" onClick={() => go("upload")}>
            <window.IconPlus size={15} /> {t("nav.add")}
          </button>
          <div className="avatar" onClick={() => setMenu((m) => !m)}>MV</div>
          {menu &&
          <div className="acct-menu card">
              <div className="acct-head">
                <div className="avatar" style={{ width: 38, height: 38 }}>MV</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Mariana V.</div>
                  <div className="muted" style={{ fontSize: 12 }}>mariana@correo.com</div>
                </div>
              </div>
              <button className="acct-item" onClick={() => {setMenu(false);go("profile");}}>
                <window.IconCrown size={16} /> {t("acct.sub")}
              </button>
              <button className="acct-item" onClick={() => {setMenu(false);onReset();}}>
                <window.IconReset size={16} /> {t("acct.reset")}
              </button>
              <button className="acct-item" onClick={() => {setMenu(false);go("landing");}}>
                <window.IconLogout size={16} /> {t("acct.logout")}
              </button>
            </div>
          }
        </div>
      </div>
    </nav>);

}

function Footer() {
  const { t } = window.useT();
  return (
    <footer className="footer">
      <div className="wrap row spread" style={{ flexWrap: "wrap", gap: 20 }}>
        <Logo />
        <div className="muted" style={{ maxWidth: "42ch" }}>{t("foot.tagline")}</div>
        <div className="muted">{t("foot.rights")}</div>
      </div>
    </footer>);

}

/* Pills de instrumentos */
function InstPill({ k, mono }) {
  const { t } = window.useT();
  const inst = window.INSTRUMENTS[k];
  if (!inst) return null;
  const Icon = inst.Icon;
  return (
    <span className={"pill" + (mono ? " pill-ghost" : "")}>
      <Icon size={13} sw={1.5} /> {t("inst." + k)}
    </span>);

}

function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

Object.assign(window, { Brandmark, Logo, LandingNav, AppNav, Footer, InstPill, fmtTime });