/* stage.jsx — La tarima: visualización del set de instrumentos de la banda.
   Cada posición se ilumina cuando ese instrumento suena. */

const STAGE_ORDER = ["guitar","piano","drums","bass","vocals","other"];
const STAGE_BACK = new Set(["drums","bass"]);

/* BandStage
   props:
   - instruments: array de claves presentes en la canción
   - youKey: tu instrumento (recibe el tag "TÚ")
   - activeKeys: array de claves que suenan ahora (controlado).
       Si es null/undefined → modo demo: resalta una rotando.
*/
function BandStage({ instruments, youKey, activeKeys }){
  const { t } = window.useT();
  const present = STAGE_ORDER.filter(k => instruments.includes(k));
  const controlled = Array.isArray(activeKeys);

  // Modo demo (no controlado): rota el resaltado para sentirse vivo.
  const [demoIdx, setDemoIdx] = React.useState(0);
  React.useEffect(() => {
    if(controlled) return;
    const id = setInterval(() => setDemoIdx(i => (i + 1) % Math.max(1, present.length)), 1200);
    return () => clearInterval(id);
  }, [controlled, present.length]);

  const isPlaying = (k, i) => controlled
    ? activeKeys.includes(k)
    : i === demoIdx;

  return (
    <div className="stage-floor">
      {present.map((k, i) => {
        const inst = window.INSTRUMENTS[k];
        const Icon = inst.Icon;
        const playing = isPlaying(k, i);
        const you = k === youKey;
        return (
          <div key={k}
               className={"stage-spot" + (STAGE_BACK.has(k)?" back":"") + (playing?" playing":"") + (you?" you":"")}>
            <div className="stage-pad">
              {you && <span className="stage-youtag">{t("band.you").toUpperCase()}</span>}
              <span className="pulse"></span>
              <Icon size={34} sw={1.4}/>
            </div>
            <span className="stage-label">{t("inst."+k)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* StagePanel — la tarima envuelta en una tarjeta con cabecera y haz de luz */
function StagePanel({ instruments, youKey, activeKeys, title, sub }){
  return (
    <div className="stageviz">
      <div className="stageviz-beam"></div>
      {(title || sub) && (
        <div className="stageviz-head">
          <div>
            {title && <div className="h3">{title}</div>}
            {sub && <div className="muted" style={{ fontSize:13, marginTop:4 }}>{sub}</div>}
          </div>
        </div>
      )}
      <BandStage instruments={instruments} youKey={youKey} activeKeys={activeKeys}/>
    </div>
  );
}

Object.assign(window, { BandStage, StagePanel });
