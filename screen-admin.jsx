/* screen-admin.jsx — Portal de admin (#admin)
   Login simple + gestión de productos de afiliado (imagen, título, precio, URL). */

const ADMIN_LS = "cordeband_admin_v1";
const ADMIN_EMAIL = "you@gmail.com";

function adminIsAuthed(){
  try { return localStorage.getItem(ADMIN_LS) === "1"; } catch(e){ return false; }
}

/* ---------- Login ---------- */
function AdminLogin({ onLogin, go }){
  const { t } = window.useT();
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    if(email.trim().toLowerCase() === ADMIN_EMAIL && pass.length >= 4){
      try { localStorage.setItem(ADMIN_LS, "1"); } catch(_){}
      onLogin();
    } else setErr(true);
  };
  return (
    <div className="admin-login-wrap page">
      <form className="card admin-login" onSubmit={submit}>
        <div className="row gap-12" style={{ marginBottom:22 }}>
          <span className="logo-mark"><window.IconLock size={17} sw={1.8}/></span>
          <span className="logo-word" style={{ fontSize:18 }}>{t("admin.brand")}</span>
        </div>
        <h1 className="h2" style={{ fontSize:26 }}>{t("admin.loginTitle")}</h1>
        <p className="lead" style={{ fontSize:14.5, marginTop:10, marginBottom:24 }}>{t("admin.loginSub")}</p>

        <div className="auth-field">
          <label className="field-label">{t("admin.email")}</label>
          <input className="input" type="email" value={email} placeholder={t("admin.emailPh")}
                 onChange={(e) => { setEmail(e.target.value); setErr(false); }} autoComplete="username"/>
        </div>
        <div className="auth-field">
          <label className="field-label">{t("admin.pass")}</label>
          <input className="input" type="password" value={pass} placeholder={t("admin.passPh")}
                 onChange={(e) => { setPass(e.target.value); setErr(false); }} autoComplete="current-password"/>
        </div>
        {err && <div className="admin-err"><window.IconClose size={14}/> {t("admin.wrong")}</div>}
        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop:8 }}>
          {t("admin.login")} <window.IconArrow size={17}/>
        </button>
        <button type="button" className="auth-link" style={{ marginTop:18, display:"block" }}
                onClick={() => go("landing")}>← {t("admin.backSite")}</button>
      </form>
    </div>
  );
}

/* ---------- Formulario de producto ---------- */
function ProductForm({ initial, onSave, onCancel }){
  const { t } = window.useT();
  const [f, setF] = React.useState(initial || {
    title:"", price:"", url:"", image:"", platform:"", instrument:"all",
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const r = new FileReader();
    r.onload = () => set("image", r.result);
    r.readAsDataURL(file);
  };
  const valid = f.title.trim() && f.url.trim();
  const submit = (e) => {
    e.preventDefault();
    if(!valid) return;
    onSave({ ...f, id: f.id || ("aff-" + Date.now()), active: f.active !== false });
  };
  const fileRef = React.useRef(null);
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <form className="modal admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className="h3" style={{ marginBottom:20 }}>{initial ? t("admin.saveEdit") : t("admin.add")}</h2>

        <div className="admin-form-grid">
          <div className="admin-img-col">
            <label className="field-label">{t("admin.fImage")}</label>
            <div className="admin-img-drop" onClick={() => fileRef.current && fileRef.current.click()}>
              {f.image
                ? <img src={f.image} alt="" />
                : <span className="col center" style={{ alignItems:"center", gap:8, color:"var(--text-3)" }}>
                    <window.IconUpload size={22}/> <span style={{ fontSize:12 }}>{t("admin.uploadImg")}</span>
                  </span>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/>
            </div>
            <input className="input" style={{ marginTop:8, fontSize:13 }} value={f.image && f.image.startsWith("data:") ? "" : f.image}
                   placeholder={t("admin.fImageUrl")} onChange={(e) => set("image", e.target.value)}/>
          </div>

          <div className="admin-fields">
            <div className="auth-field" style={{ marginBottom:12 }}>
              <label className="field-label">{t("admin.fTitle")}</label>
              <input className="input" value={f.title} placeholder={t("admin.fTitlePh")} onChange={(e) => set("title", e.target.value)}/>
            </div>
            <div className="row gap-12" style={{ marginBottom:12 }}>
              <div className="auth-field grow" style={{ margin:0 }}>
                <label className="field-label">{t("admin.fPrice")}</label>
                <input className="input" value={f.price} placeholder={t("admin.fPricePh")} onChange={(e) => set("price", e.target.value)}/>
              </div>
              <div className="auth-field grow" style={{ margin:0 }}>
                <label className="field-label">{t("admin.fPlatform")}</label>
                <input className="input" value={f.platform} placeholder={t("admin.fPlatformPh")} onChange={(e) => set("platform", e.target.value)}/>
              </div>
            </div>
            <div className="auth-field" style={{ marginBottom:12 }}>
              <label className="field-label">{t("admin.fUrl")}</label>
              <input className="input" value={f.url} placeholder={t("admin.fUrlPh")} onChange={(e) => set("url", e.target.value)}/>
            </div>
            <div className="auth-field" style={{ margin:0 }}>
              <label className="field-label">{t("admin.fInstrument")}</label>
              <select className="input" value={f.instrument} onChange={(e) => set("instrument", e.target.value)}>
                <option value="all">{t("admin.all")}</option>
                {window.INST_ORDER.map(k => <option key={k} value={k}>{t("inst."+k)}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="aff-preview">
          <div className="aff-preview-label"><window.IconSpark size={12}/> {t("admin.preview")}</div>
          <div className="aff-preview-card">
            <div className="aff-preview-thumb">{f.image ? <img src={f.image} alt=""/> : <window.IconCart size={20}/>}</div>
            <div className="aff-preview-info">
              <div className="aff-preview-name">{f.title || t("admin.fTitlePh")}</div>
              <div className="aff-preview-cat">{f.platform || "Amazon"}</div>
              <div className="aff-preview-buy">
                <span className="aff-preview-price">{f.price || "$0.00"}</span>
                <span className="aff-preview-go">{f.platform || "Ver"} <window.IconExternal size={11}/></span>
              </div>
            </div>
          </div>
        </div>

        <div className="row gap-12" style={{ marginTop:24 }}>
          <button type="button" className="btn btn-ghost grow" onClick={onCancel}>{t("admin.cancel")}</button>
          <button type="submit" className="btn btn-primary grow" disabled={!valid}>{initial ? t("admin.saveEdit") : t("admin.save")}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Tarjeta de producto ---------- */
function ProductRow({ p, onEdit, onDelete, onToggle }){
  const { t } = window.useT();
  const active = p.active !== false;
  const instLabel = p.instrument === "all" ? t("admin.all") : t("inst."+p.instrument);
  return (
    <div className={"card admin-prod" + (active ? "" : " inactive")}>
      <div className="admin-prod-thumb">
        {p.image ? <img src={p.image} alt={p.title}/> : <window.IconCart size={22}/>}
      </div>
      <div className="admin-prod-info">
        <div className="admin-prod-title">{p.title}</div>
        <div className="admin-prod-meta">
          <span className="aff-price" style={{ fontSize:14 }}>{p.price || "—"}</span>
          {p.platform && <><span style={{ opacity:.4 }}>·</span><span>{p.platform}</span></>}
          <span className="pill" style={{ padding:"3px 9px", fontSize:11 }}>{instLabel}</span>
          <span className={"admin-prod-state " + (active ? "on" : "off")}>{active ? t("admin.live") : t("admin.hidden")}</span>
        </div>
        <a className="admin-prod-url" href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a>
      </div>
      <div className="admin-prod-actions">
        <button className={"switch" + (active ? " on" : "")} onClick={() => onToggle(p.id)} aria-label={active ? t("admin.hide") : t("admin.publish")}></button>
        <button className="iconbtn" onClick={() => onEdit(p)} aria-label={t("admin.edit")}><window.IconEdit size={16}/></button>
        <button className="iconbtn admin-del" onClick={() => onDelete(p.id)} aria-label={t("admin.del")}><window.IconTrash size={16}/></button>
      </div>
    </div>
  );
}

/* ---------- Fila de canción destacada ---------- */
function AdminFeaturedRow({ s, onToggle, onDelete }){
  const { t } = window.useT();
  return (
    <div className="card feat-admin-row">
      <span className="feat-admin-glyph">{s.glyph}</span>
      <div className="feat-admin-info">
        <div className="feat-admin-title">{s.title}</div>
        <div className="feat-admin-meta">
          <span>{s.artist}</span><span style={{ opacity:.4 }}>·</span>
          <span>{s.bpm} BPM · {s.keySig}</span>
          <span className="tag-perma"><window.IconLock size={11}/> {t("admin.permanent")}</span>
          <span className={"admin-prod-state " + (s.published ? "on" : "off")}>{s.published ? t("admin.published") : t("admin.hidden")}</span>
        </div>
      </div>
      <div className="feat-admin-ctrl">
        <label className="pubswitch">
          {s.published ? t("admin.hide") : t("admin.publish")}
          <button className={"switch" + (s.published ? " on" : "")} onClick={() => onToggle(s.id)} aria-label={s.published ? t("admin.hide") : t("admin.publish")}></button>
        </label>
        <button className="iconbtn admin-del" onClick={() => onDelete(s.id)} aria-label={t("admin.del")}><window.IconTrash size={16}/></button>
      </div>
    </div>
  );
}

/* ---------- Panel ---------- */
function AdminPanel({ onLogout, go }){
  const { t } = window.useT();
  const [tab, setTab] = React.useState("aff");
  const [products, setProducts] = React.useState(() => window.loadAdminAffiliates());
  const [editing, setEditing] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [featured, setFeatured] = React.useState(() => window.loadFeatured());
  const [uploading, setUploading] = React.useState(false);

  const persist = (list) => { setProducts(list); window.saveAdminAffiliates(list); };
  const save = (prod) => {
    const exists = products.some(p => p.id === prod.id);
    persist(exists ? products.map(p => p.id===prod.id ? prod : p) : [prod, ...products]);
    setShowForm(false); setEditing(null);
  };
  const del = (id) => persist(products.filter(p => p.id !== id));
  const toggle = (id) => persist(products.map(p => p.id===id ? { ...p, active: p.active === false } : p));

  const persistFeat = (list) => { setFeatured(list); window.saveFeatured(list); };
  const toggleFeat = (id) => persistFeat(featured.map(s => s.id===id ? { ...s, published: !s.published } : s));
  const delFeat = (id) => persistFeat(featured.filter(s => s.id !== id));
  const addFeat = () => {
    setUploading(true);
    setTimeout(() => {
      const pool = [
        { title:"Noche sin Final",  keySig:"Mi menor",  bpm:112, instruments:["guitar","vocals","drums","bass","piano"], glyph:"♫" },
        { title:"Costa Norte",      keySig:"Sol mayor", bpm:96,  instruments:["guitar","piano","bass","drums"], glyph:"♪" },
        { title:"Vuelo Nocturno",   keySig:"La menor",  bpm:124, instruments:["guitar","vocals","drums","bass"], glyph:"♬" },
      ];
      const pick = pool[Math.floor(Math.random()*pool.length)];
      const song = { ...pick, id:"f-"+Date.now(), artist:"Cordeband Sessions", featured:true, published:false };
      persistFeat([song, ...featured]);
      setUploading(false);
    }, 2200);
  };

  const onAddClick = () => {
    if(tab === "aff"){ setEditing(null); setShowForm(true); }
    else addFeat();
  };

  return (
    <div className="admin-shell page">
      <header className="admin-bar">
        <div className="row gap-12">
          <span className="logo-mark"><window.IconNote size={17} sw={1.7}/></span>
          <span className="logo-word" style={{ fontSize:18 }}>{t("admin.brand")}</span>
        </div>
        <div className="row gap-16">
          <window.LangToggle/>
          <span className="muted" style={{ fontSize:12.5 }}>{t("admin.signedAs")} <b style={{ color:"#fff" }}>{ADMIN_EMAIL}</b></span>
          <button className="btn btn-ghost btn-sm" onClick={() => go("dashboard")}>{t("admin.backSite")}</button>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}><window.IconLogout size={14}/> {t("admin.logout")}</button>
        </div>
      </header>

      <main className="wrap admin-main">
        <div className="admin-tabs">
          <button className={"admin-tab" + (tab==="aff" ? " on" : "")} onClick={() => setTab("aff")}>
            <window.IconCart size={15}/> {t("admin.tabAff")} <span className="tab-count">{products.length}</span>
          </button>
          <button className={"admin-tab" + (tab==="feat" ? " on" : "")} onClick={() => setTab("feat")}>
            <window.IconNote size={15}/> {t("admin.tabFeat")} <span className="tab-count">{featured.length}</span>
          </button>
        </div>

        <div className="page-head">
          <div>
            <span className="eyebrow">{t("admin.brand")}</span>
            <h1 className="h1" style={{ fontSize:"clamp(28px,3.4vw,40px)" }}>{tab==="aff" ? t("admin.title") : t("admin.featTitle")}</h1>
            <p className="lead" style={{ fontSize:15, marginTop:10, maxWidth:"56ch" }}>{tab==="aff" ? t("admin.sub") : t("admin.featSub")}</p>
          </div>
          <button className="btn btn-primary" onClick={onAddClick} disabled={uploading}>
            {tab==="aff"
              ? <><window.IconPlus size={15}/> {t("admin.add")}</>
              : (uploading
                  ? <><span className="spin"><window.IconSpin size={15}/></span> {t("admin.uploadingFeat")}</>
                  : <><window.IconUpload size={15}/> {t("admin.featAdd")}</>)}
          </button>
        </div>

        {tab === "aff" ? (
          <>
            <div className="muted" style={{ fontSize:13, marginBottom:16 }}>
              {products.length} {products.length === 1 ? t("admin.count1") : t("admin.count")}
            </div>
            {products.length === 0 ? (
              <div className="admin-empty card">
                <span className="empty-art" style={{ width:72, height:72, margin:"0 auto 18px" }}><window.IconCart size={28}/></span>
                <div className="lead" style={{ fontSize:15 }}>{t("admin.empty")}</div>
                <button className="btn btn-primary" style={{ marginTop:20 }} onClick={() => { setEditing(null); setShowForm(true); }}>
                  <window.IconPlus size={15}/> {t("admin.add")}
                </button>
              </div>
            ) : (
              <div className="admin-grid">
                {products.map(p => (
                  <ProductRow key={p.id} p={p}
                    onEdit={(pr) => { setEditing(pr); setShowForm(true); }}
                    onDelete={del} onToggle={toggle}/>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="muted" style={{ fontSize:13, marginBottom:16 }}>
              {featured.length} {featured.length === 1 ? t("admin.featCount1") : t("admin.featCount")}
            </div>
            {featured.length === 0 ? (
              <div className="admin-empty card">
                <span className="empty-art" style={{ width:72, height:72, margin:"0 auto 18px" }}><window.IconNote size={28}/></span>
                <div className="lead" style={{ fontSize:15 }}>{t("admin.featEmpty")}</div>
                <button className="btn btn-primary" style={{ marginTop:20 }} onClick={addFeat} disabled={uploading}>
                  <window.IconUpload size={15}/> {t("admin.featAdd")}
                </button>
              </div>
            ) : (
              <div className="bands-list">
                {featured.map(s => (
                  <AdminFeaturedRow key={s.id} s={s} onToggle={toggleFeat} onDelete={delFeat}/>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <ProductForm initial={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }}/>
      )}
    </div>
  );
}

function AdminScreen({ go }){
  const [authed, setAuthed] = React.useState(adminIsAuthed());
  const logout = () => { try { localStorage.removeItem(ADMIN_LS); } catch(_){} setAuthed(false); };
  return authed
    ? <AdminPanel onLogout={logout} go={go}/>
    : <AdminLogin onLogin={() => setAuthed(true)} go={go}/>;
}

Object.assign(window, { AdminScreen });
