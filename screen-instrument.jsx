/* screen-instrument.jsx — Selector de instrumento + tarima */

function InstrumentScreen({ go, song, lastInstrument, onChoose }){
  const { t } = window.useT();
  const available = new Set(song ? song.instruments : []);
  const [sel, setSel] = React.useState(
    lastInstrument && available.has(lastInstrument) ? lastInstrument : null
  );

  return (
    <main className="wrap app-main page" style={{ maxWidth:900 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => go("dashboard")} style={{ marginBottom:24 }}>
        <window.IconArrowL size={15}/> {t("nav.library")}
      </button>

      <div style={{ textAlign:"center" }}>
        <span className="eyebrow">{song ? song.title : "—"}</span>
        <h1 className="h1" style={{ fontSize:"clamp(32px,4vw,46px)", marginTop:14 }}>{t("sel.whatPlay")}</h1>
        <p className="lead" style={{ margin:"16px auto 0", maxWidth:"44ch" }}>{t("sel.sub")}</p>
      </div>

      {/* Tarima: cómo se reparte la banda en esta canción */}
      <div style={{ marginTop:36 }}>
        <window.StagePanel
          instruments={song ? song.instruments : []}
          youKey={sel}
          title={t("sel.stageTitle")}
          sub={t("sel.stageSub")} />
      </div>

      <div className="inst-grid">
        {window.INST_ORDER.map(k => {
          const inst = window.INSTRUMENTS[k];
          const Icon = inst.Icon;
          const on = available.has(k);
          const isSel = sel === k;
          return (
            <button key={k}
              className={"inst-card" + (isSel?" sel":"") + (on?"":" off")}
              disabled={!on}
              onClick={() => on && setSel(k)}>
              {isSel && <span className="inst-check"><window.IconCheck size={13} sw={2.4}/></span>}
              <span className="inst-ico"><Icon size={34} sw={1.4}/></span>
              <span className="inst-name">{t("inst."+k)}</span>
              <span className="inst-state">{on ? (k===lastInstrument ? t("sel.last") : t("common.available")) : t("sel.notDetected")}</span>
            </button>
          );
        })}
      </div>

      <div className="row center" style={{ marginTop:40 }}>
        <button className="btn btn-primary btn-lg" disabled={!sel}
                onClick={() => sel && onChoose(sel)}>
          {t("sel.enter")} <window.IconArrow size={17}/>
        </button>
      </div>
    </main>
  );
}

Object.assign(window, { InstrumentScreen });
