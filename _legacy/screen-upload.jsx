/* screen-upload.jsx — Subir MP3 + procesamiento en tiempo real */

function Dropzone({ onPick, regenSong }){
  const { t } = window.useT();
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);
  const regen = !!regenSong;
  return (
    <div className="upload-wrap page">
      <div className="section-head" style={{ textAlign:"center", margin:"0 auto 34px", maxWidth:"none" }}>
        <span className="eyebrow">{regen ? t("up.regenEyebrow") : t("up.eyebrow")}</span>
        <h1 className="h1" style={{ fontSize:"clamp(32px,4vw,46px)", marginTop:14 }}>{regen ? t("up.regenTitle") : t("up.title")}</h1>
        {regen && <div className="h3 serif" style={{ color:"var(--acc)", marginTop:10 }}>{regenSong.title} · {regenSong.artist}</div>}
        <p className="lead" style={{ margin:"16px auto 0", maxWidth:"50ch" }}>{regen ? t("up.regenSub") : t("up.sub")}</p>
      </div>

      <div className={"dropzone" + (drag?" drag":"")}
           onClick={() => inputRef.current && inputRef.current.click()}
           onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
           onDragLeave={() => setDrag(false)}
           onDrop={(e) => { e.preventDefault(); setDrag(false); onPick("Toma_demo_master.mp3"); }}>
        <input ref={inputRef} type="file" accept=".mp3,.wav,.flac,audio/*" hidden
               onChange={() => onPick("Toma_demo_master.mp3")} />
        <div className="dz-icon"><window.IconUpload size={28}/></div>
        <div className="h3 serif">{regen ? t("up.regenDrop") : t("up.drop")}</div>
        <p className="muted" style={{ margin:"8px 0 0" }}>{t("up.click")}</p>
        <div className="dz-formats">
          {["MP3","WAV","FLAC"].map(f => <span key={f} className="pill">{f}</span>)}
        </div>
      </div>

      <div className="suggest">
        <span className="logo-mark" style={{ background:"var(--elev-3)", color:"var(--acc)", border:"1px solid var(--line)" }}>
          <window.IconCart size={16}/>
        </span>
        <div className="grow">
          <div style={{ fontWeight:600, fontSize:14 }}>{t("up.suggestT")}</div>
          <div className="muted" style={{ fontSize:13 }}>{t("up.suggestB")}</div>
        </div>
        <button className="btn btn-ghost btn-sm">{t("up.search")} <window.IconExternal size={14}/></button>
      </div>
    </div>
  );
}

function ProcessingStatus({ fileName, onDone, onCancel }){
  const { t } = window.useT();
  const [pct, setPct] = React.useState(0);
  const [error, setError] = React.useState(false);

  const PROC_STEPS = [
    { label:t("up.p1t"), sub:t("up.p1b") },
    { label:t("up.p2t"), sub:t("up.p2b") },
    { label:t("up.p3t"), sub:t("up.p3b") },
    { label:t("up.p4t"), sub:t("up.p4b") },
  ];

  React.useEffect(() => {
    if(error) return;
    let p = 0;
    const id = setInterval(() => {
      p += 1.4 + Math.random()*2.2;
      if(p >= 100){ p = 100; clearInterval(id); setTimeout(onDone, 650); }
      setPct(p);
    }, 90);
    return () => clearInterval(id);
  }, [error]);

  const activeStep = pct >= 100 ? 3 : pct >= 65 ? 2 : pct >= 20 ? 1 : 0;
  const detected = { title:"Otra Vez la Lluvia", artist:"Camila Reyes" };

  return (
    <div className="upload-wrap page">
      <div className="card proc-card">
        <div className="row spread" style={{ marginBottom:20 }}>
          <div className="row gap-12">
            <span className="logo-mark" style={{ width:42, height:42, borderRadius:10 }}><window.IconWave size={20}/></span>
            <div>
              <div style={{ fontWeight:700, fontSize:15 }}>{error ? fileName : (pct>=20 ? detected.title : fileName)}</div>
              <div className="muted" style={{ fontSize:13 }}>{pct>=20 && !error ? detected.artist : t("up.uploading")}</div>
            </div>
          </div>
          {!error && pct < 100 && <button className="btn btn-ghost btn-sm" onClick={onCancel}>{t("up.cancel")}</button>}
        </div>

        {error ? (
          <div style={{ textAlign:"center", padding:"18px 0 4px" }}>
            <div className="dz-icon" style={{ margin:"0 auto 18px", background:"var(--elev-3)" }}><window.IconClose size={24}/></div>
            <div className="h3 serif">{t("up.errT")}</div>
            <p className="muted" style={{ margin:"8px 0 22px" }}>{t("up.errB")}</p>
            <div className="row center gap-12">
              <button className="btn btn-ghost" onClick={onCancel}>{t("up.chooseOther")}</button>
              <button className="btn btn-primary" onClick={() => { setError(false); setPct(0); }}>{t("up.retry")}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="proc-progress" style={{ marginBottom:18 }}><i style={{ width:`${pct}%` }}/></div>
            <div className="proc-steps">
              {PROC_STEPS.map((s, i) => {
                const state = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
                return (
                  <div key={i} className={"proc-step " + state}>
                    <div className="proc-dot">
                      {state==="done" ? <window.IconCheck size={15} sw={2.2}/>
                        : state==="active" ? <span className="spin"><window.IconSpin size={15}/></span>
                        : <span style={{ fontSize:12, fontWeight:700 }}>{i+1}</span>}
                    </div>
                    <div className="grow">
                      <div className="pl">{s.label}</div>
                      <div className="ps">{s.sub}</div>
                    </div>
                    {state==="active" && <span className="muted tnum" style={{ fontSize:12 }}>{Math.round(pct)}%</span>}
                  </div>
                );
              })}
            </div>
            <div className="row gap-12" style={{ marginTop:20, color:"var(--text-3)", fontSize:13 }}>
              <window.IconClock size={15}/> {t("up.takes")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UploadScreen({ go, onComplete, regenSong, onExit }){
  const [file, setFile] = React.useState(null);
  const exit = onExit || (() => go("dashboard"));
  if(!file){
    return <Dropzone onPick={setFile} regenSong={regenSong} />;
  }
  return (
    <ProcessingStatus
      fileName={regenSong ? regenSong.title : file}
      onCancel={() => { setFile(null); exit(); }}
      onDone={() => regenSong
        ? onComplete(regenSong)
        : onComplete({
            id:"new-"+Date.now(), title:"Otra Vez la Lluvia", artist:"Camila Reyes",
            instruments:["guitar","vocals","drums","bass","piano"], duration:206,
            bpm:84, keySig:"Re mayor", added:"recién", glyph:"♪",
          })}
    />
  );
}

Object.assign(window, { UploadScreen });
