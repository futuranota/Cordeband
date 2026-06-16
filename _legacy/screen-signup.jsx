/* screen-signup.jsx — Crear cuenta (gate antes de descargar el MP3) */

function SignupScreen({ go, mode = "signup", onComplete }) {
  const { t } = window.useT();
  const isLogin = mode === "login";
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);

  const valid = (isLogin || name.trim().length > 1) && /\S+@\S+\.\S+/.test(email) && pass.length >= 6;
  const submit = (e) => {e.preventDefault();if (valid) onComplete();};

  return (
    <main className="wrap app-main page">
      <div className="auth-wrap">
        <form className="auth-form" onSubmit={submit}>
          <span className="eyebrow">{isLogin ? t("nav.login") : t("auth.eyebrow")}</span>
          <h1 className="h2" style={{ marginTop: 14 }}>{isLogin ? t("nav.login") : t("auth.title")}</h1>
          <p className="lead" style={{ fontSize: 15, marginTop: 12, marginBottom: 26 }}>{t("auth.sub")}</p>

          {!isLogin &&
          <div className="auth-field">
              <label className="field-label">{t("auth.name")}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t("auth.namePh")} autoComplete="name" />
            </div>
          }
          <div className="auth-field">
            <label className="field-label">{t("auth.email")}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPh")} autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="field-label">{t("auth.pass")}</label>
            <div className="pwfield">
              <input className="input" type={showPass ? "text" : "password"} value={pass}
              onChange={(e) => setPass(e.target.value)} placeholder={t("auth.passPh")}
              autoComplete={isLogin ? "current-password" : "new-password"} />
              <button type="button" className="pwtoggle" onClick={() => setShowPass((s) => !s)} aria-label="Mostrar contraseña">
                {showPass ? <window.IconMute size={17} /> : <window.IconVolume size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!valid} style={{ marginTop: 8, backgroundColor:"#fff", color:"#0a0a0a" }}>
            {isLogin ? t("nav.login") : t("auth.create")} <window.IconArrow size={17} />
          </button>

          <div className="auth-sep">{t("auth.or")}</div>
          <div className="auth-oauth">
            <button type="button" className="btn btn-ghost btn-block" onClick={onComplete}>{t("auth.google")}</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={onComplete}>{t("auth.apple")}</button>
          </div>

          <div className="auth-foot">
            {isLogin ?
            <span>{t("auth.have")} </span> :
            <span>{t("auth.have")} </span>}
            <button type="button" className="auth-link"
            onClick={() => go(isLogin ? "signup" : "login")}>
              {isLogin ? t("nav.start") : t("auth.loginLink")}
            </button>
          </div>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 16, lineHeight: 1.5 }}>{t("auth.terms")}</p>
        </form>

        <aside className="auth-aside">
          <div style={{ position: "relative", zIndex: 1 }}>
            <span className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgb(255, 255, 255)" }}><window.IconNote size={24} sw={1.7} /></span>
            <h2 className="h2" style={{ marginTop: 20, fontSize: 26 }}>{t("auth.asideTitle")}</h2>
          </div>
          <ul className="auth-aside-list">
            {[t("auth.a1"), t("auth.a2"), t("auth.a3"), t("auth.a4")].map((x, i) =>
            <li key={i}><window.IconCheck size={18} sw={2.2} /> {x}</li>
            )}
          </ul>
        </aside>
      </div>
    </main>);

}

Object.assign(window, { SignupScreen });