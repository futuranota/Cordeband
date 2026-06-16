/* screen-profile.jsx — Perfil / Suscripción + modal de límite */

function LimitModal({ onClose, onUpgrade }){
  const { t } = window.useT();
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cap"><window.IconCrown size={26}/></div>
        <h2 className="h2" style={{ fontSize:28 }}>{t("modal.title")}</h2>
        <p className="muted" style={{ margin:"12px 0 22px", fontSize:14.5 }}>{t("modal.sub")}</p>
        <div className="card" style={{ padding:"18px 20px", marginBottom:22, background:"var(--elev-2)", boxShadow:"none" }}>
          <div className="row spread" style={{ marginBottom:14 }}>
            <span className="badge-pro"><window.IconCrown size={12} sw={1.8}/> Pro</span>
            <span><span className="serif" style={{ fontSize:28, fontWeight:700, color:"#fff" }}>$9</span><span className="muted" style={{ fontSize:13 }}>{t("common.perMonth")}</span></span>
          </div>
          <ul className="checklist">
            {t("modal.feats").map((f,i) => (
              <li key={i}><window.IconCheck size={16} sw={2}/> {f}</li>
            ))}
          </ul>
        </div>
        <div className="col gap-12">
          <button className="btn btn-primary btn-block btn-lg" onClick={onUpgrade}>{t("modal.upgrade")}</button>
          <button className="btn btn-ghost btn-block" onClick={onClose}>{t("modal.later")}</button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ go, plan, planLimit, used, onUpgrade, onDowngrade }){
  const { t } = window.useT();
  const sessions = [
    { song:"Las Luces de Enero", inst:"guitar", when:t("profile.recent")==="Recent sessions"?"Yesterday · 38 min":"Ayer · 38 min" },
    { song:"Verano en Reversa", inst:"guitar", when:t("profile.recent")==="Recent sessions"?"3 days ago · 52 min":"Hace 3 días · 52 min" },
    { song:"Cielo Partido", inst:"bass", when:t("profile.recent")==="Recent sessions"?"6 days ago · 24 min":"Hace 6 días · 24 min" },
  ];
  const isPro = plan === "pro";
  const isBanda = plan === "banda";
  const isPaid = plan !== "free";
  return (
    <main className="wrap app-main page">
      <div className="page-head">
        <div>
          <span className="eyebrow">{t("profile.eyebrow")}</span>
          <h1 className="h1">{t("profile.title")}</h1>
        </div>
      </div>

      <div className="profile-grid">
        <div className="col gap-24">
          <div className={"card price" + (isPaid?" pro":"")} style={{ padding:"30px 30px" }}>
            <div className="row spread" style={{ alignItems:"flex-start" }}>
              <div>
                <div className="eyebrow">{t("profile.currentPlan")}</div>
                <div className="row" style={{ alignItems:"flex-end", gap:8, marginTop:10 }}>
                  <span className="amount">{isBanda?t("common.banda"):isPro?t("common.pro"):t("common.free")}</span>
                  <span style={{ marginBottom:8, color:"var(--text-3)", fontSize:14 }}>{isBanda?"· $19"+t("common.perMonth"):isPro?"· $9"+t("common.perMonth"):""}</span>
                </div>
              </div>
              {isBanda
                ? <span className="badge-pro badge-band"><window.IconBand size={12} sw={1.8}/> Banda</span>
                : isPro && <span className="badge-pro"><window.IconCrown size={12} sw={1.8}/> Pro</span>}
            </div>

            {!isPaid && (
              <div style={{ margin:"22px 0 4px" }}>
                <div className="row spread" style={{ fontSize:13 }}>
                  <span className="muted">{t("profile.songsMonth")}</span>
                  <span className="tnum" style={{ fontWeight:600 }}>{used} / {planLimit}</span>
                </div>
                <div className="meter" style={{ width:"100%", marginTop:8 }}>
                  <i style={{ width:`${Math.min(100,used/planLimit*100)}%` }}/>
                </div>
                <div className="muted" style={{ fontSize:12, marginTop:8 }}>{t("profile.renews")}</div>
              </div>
            )}

            <ul style={{ listStyle:"none", padding:0, margin:"22px 0 0", display:"flex", flexDirection:"column", gap:12 }}>
              {(isBanda ? t("price.bandaFeat") : isPro ? t("price.proFeat") : t("price.freeFeat")).map((f,i) => (
                <li key={i} style={{ display:"flex", gap:10, fontSize:14, color: isPaid?"rgba(255,255,255,.86)":"var(--text-2)" }}>
                  <window.IconCheck size={16} sw={2}/> {f}
                </li>
              ))}
            </ul>

            <div className="price-cta">
              {plan === "free" && (
                <div className="col gap-12">
                  <button className="btn btn-primary btn-block btn-lg" onClick={() => onUpgrade("pro")}><window.IconCrown size={16}/> {t("price.ctaPro")}</button>
                  <button className="btn btn-white btn-block" onClick={() => onUpgrade("banda")}><window.IconBand size={16}/> {t("price.ctaBanda")}</button>
                </div>
              )}
              {plan === "pro" && (
                <div className="col gap-12">
                  <button className="btn btn-white btn-block btn-lg" onClick={() => onUpgrade("banda")}><window.IconBand size={16}/> {t("price.ctaBanda")}</button>
                  <button className="btn btn-ghost btn-block" onClick={onDowngrade}>{t("profile.cancelSub")}</button>
                </div>
              )}
              {plan === "banda" && (
                <button className="btn btn-white btn-block" onClick={onDowngrade}>{t("profile.cancelSub")}</button>
              )}
            </div>
          </div>
        </div>

        <div className="col gap-24">
          <div className="stat-row">
            <div className="card stat">
              <div className="stat-n tnum">{isPaid?"∞":(planLimit-used)}</div>
              <div className="stat-l">{isPaid?t("profile.availSongs"):t("profile.remainSongs")}</div>
            </div>
            <div className="card stat">
              <div className="stat-n tnum">114</div>
              <div className="stat-l">{t("profile.practiceMin")}</div>
            </div>
          </div>

          <div className="card" style={{ padding:"22px 24px" }}>
            <div className="row spread" style={{ marginBottom:6 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>{t("profile.recent")}</span>
              <span className="muted" style={{ fontSize:12 }}>{t("profile.last7")}</span>
            </div>
            {sessions.map((s,i) => {
              const Icon = window.INSTRUMENTS[s.inst].Icon;
              return (
                <div key={i} className="session">
                  <div className="row gap-12">
                    <span className="stem-ico"><Icon size={15} sw={1.5}/></span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500 }}>{s.song}</div>
                      <div className="muted" style={{ fontSize:12 }}>{t("inst."+s.inst)}</div>
                    </div>
                  </div>
                  <span className="muted" style={{ fontSize:12.5 }}>{s.when}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { ProfileScreen, LimitModal });
