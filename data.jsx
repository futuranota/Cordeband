/* data.jsx — datos de ejemplo + generación de la partitura
   Canciones inventadas (sin marcas reales). */

/* ---------- Instrumentos ---------- */
const INSTRUMENTS = {
  guitar:  { key:"guitar",  name:"Guitarra", Icon: window.InstGuitar },
  piano:   { key:"piano",   name:"Piano",    Icon: window.InstPiano  },
  bass:    { key:"bass",    name:"Bajo",     Icon: window.InstBass   },
  drums:   { key:"drums",   name:"Batería",  Icon: window.InstDrums  },
  vocals:  { key:"vocals",  name:"Voz",      Icon: window.InstVocals },
  other:   { key:"other",   name:"Otros",    Icon: window.InstOther  },
};
const INST_ORDER = ["guitar","piano","bass","drums","vocals","other"];

/* ---------- Biblioteca ----------
   stemsExpiresAt: TTL de 48h de los stems de audio (la partitura es permanente).
   addedThisMonth: solo cuenta para el límite del plan gratis (1/mes). */
const NOW = Date.now();
const H = 3600 * 1000;
const LIBRARY = [
  { id:"s1", title:"Las Luces de Enero", artist:"Mariana Velasco",
    instruments:["guitar","vocals","drums","bass","piano"], duration:222,
    bpm:88, keySig:"La menor", added:"hace 2 días", glyph:"♪",
    stemsExpiresAt: NOW + 38*H, addedThisMonth:false },
  { id:"s2", title:"Cielo Partido", artist:"El Último Vagón",
    instruments:["guitar","vocals","drums","bass"], duration:245,
    bpm:120, keySig:"Mi menor", added:"hace 5 días", glyph:"♫",
    stemsExpiresAt: NOW - 2*H, addedThisMonth:false },
  { id:"s3", title:"Verano en Reversa", artist:"Joaquín Sabater",
    instruments:["guitar","vocals","drums","piano"], duration:198,
    bpm:96, keySig:"Sol mayor", added:"la semana pasada", glyph:"♩",
    stemsExpiresAt: NOW + 5*H, addedThisMonth:false },
];

/* ---------- Stems TTL (48h) ---------- */
function stemsMsLeft(song){
  if(!song || song.stemsExpiresAt == null) return Infinity;
  return song.stemsExpiresAt - Date.now();
}
function stemsExpired(song){ return stemsMsLeft(song) <= 0; }

/* ---------- Canciones destacadas (is_featured) ----------
   Las sube el admin; aparecen en el dashboard de todos sin TTL.
   El admin las gestiona en localStorage (panel «/admin»). */
const FEAT_LS = "cordeband_featured_v1";
const DEFAULT_FEATURED = [
  { id:"f1", title:"Río de Neon", artist:"Cordeband Sessions",
    instruments:["guitar","vocals","drums","bass","piano"], duration:208,
    bpm:102, keySig:"Do mayor", glyph:"♬", featured:true, published:true },
  { id:"f2", title:"Madrugada", artist:"Cordeband Sessions",
    instruments:["guitar","piano","bass","drums"], duration:176,
    bpm:78, keySig:"Re menor", glyph:"♪", featured:true, published:true },
  { id:"f3", title:"Carretera Abierta", artist:"Cordeband Sessions",
    instruments:["guitar","vocals","drums","bass"], duration:231,
    bpm:128, keySig:"La mayor", glyph:"♫", featured:true, published:false },
];
function loadFeatured(){
  try {
    const raw = localStorage.getItem(FEAT_LS);
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return DEFAULT_FEATURED;
}
function saveFeatured(list){
  try { localStorage.setItem(FEAT_LS, JSON.stringify(list)); } catch(e){}
}
/* Para el dashboard de usuarios: solo las publicadas. Stems permanentes. */
function publishedFeatured(){
  return loadFeatured().filter(s => s.published).map(s => ({ ...s, stemsExpiresAt: null, isFeatured:true }));
}

/* ---------- Salas de banda (simulado en cliente) ----------
   Plan Banda: sala en tiempo real. Aquí simulamos miembros y sync. */
function makeRoomCode(){
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const n = "23456789";
  return "BND-" + a[Math.floor(Math.random()*a.length)] + n[Math.floor(Math.random()*n.length)] + a[Math.floor(Math.random()*a.length)];
}
/* Miembros simulados que se van «uniendo» al lobby. */
const SIM_MEMBERS = [
  { id:"m_d", name:"Diego",   instrument:"drums",  ini:"D", color:"#4d9fff", delay:1400 },
  { id:"m_s", name:"Sofía",   instrument:"bass",   ini:"S", color:"#e0a92b", delay:3200 },
  { id:"m_l", name:"Lucía",   instrument:"vocals", ini:"L", color:"#c97bff", delay:5200 },
  { id:"m_t", name:"Tomás",   instrument:"piano",  ini:"T", color:"#ff7676", delay:7200 },
];

/* ---------- Afiliados (contexto: guitarra) ---------- */
const AFFILIATES = {
  guitar:[
    { id:"a1", name:"Cuerdas Elixir Nanoweb Light", cat:"Cuerdas", price:"$14.99", platform:"Amazon", Icon: window.IconWave },
    { id:"a2", name:"Púas Dunlop Tortex .73mm — 72u", cat:"Púas", price:"$9.49", platform:"Amazon", Icon: window.IconNote },
    { id:"a3", name:"Pedal Overdrive Boss SD-1", cat:"Pedales", price:"$59.00", platform:"Sweetwater", Icon: window.IconGauge },
    { id:"a4", name:"Capo Kyser Quick-Change", cat:"Accesorios", price:"$22.95", platform:"Sweetwater", Icon: window.IconLoop },
    { id:"a5", name:"Afinador Snark ST-8 Clip-On", cat:"Afinadores", price:"$13.99", platform:"Amazon", Icon: window.IconClock },
  ],
  piano:[
    { id:"p1", name:"Banco ajustable On-Stage", cat:"Asientos", price:"$74.99", platform:"Sweetwater", Icon: window.IconGauge },
    { id:"p2", name:"Pedal sustain M-Audio SP-2", cat:"Pedales", price:"$19.99", platform:"Amazon", Icon: window.IconLoop },
  ],
  bass:[
    { id:"b1", name:"Cuerdas Ernie Ball Slinky Bass", cat:"Cuerdas", price:"$24.99", platform:"Amazon", Icon: window.IconWave },
    { id:"b2", name:"Pedal compresor TC Electronic", cat:"Pedales", price:"$49.00", platform:"Sweetwater", Icon: window.IconGauge },
  ],
  drums:[
    { id:"d1", name:"Baquetas Vic Firth 5A — par", cat:"Baquetas", price:"$11.99", platform:"Amazon", Icon: window.IconNote },
    { id:"d2", name:"Práctica pad Evans RealFeel", cat:"Accesorios", price:"$29.99", platform:"Sweetwater", Icon: window.IconLoop },
  ],
  vocals:[
    { id:"v1", name:"Micrófono Shure SM58", cat:"Micrófonos", price:"$99.00", platform:"Sweetwater", Icon: window.IconWave },
  ],
  other:[],
};

/* ---------- Stems del reproductor (mezcla) ---------- */
const STEMS = [
  { key:"vocals", name:"Voz",      Icon: window.InstVocals, def:78 },
  { key:"drums",  name:"Batería",  Icon: window.InstDrums,  def:82 },
  { key:"bass",   name:"Bajo",     Icon: window.InstBass,   def:80 },
  { key:"piano",  name:"Piano",    Icon: window.InstPiano,  def:70 },
  { key:"guitar", name:"Guitarra", Icon: window.InstGuitar, def:0  }, // silenciado (el que practicas)
];

/* ============================================================
   Partitura — generación de notas
   ============================================================ */
// Afinación estándar (de cuerda 1 aguda a 6 grave)
const TUNING = [64, 59, 55, 50, 45, 40]; // E B G D A E

function diatonicIndex(midi){
  const pcMap = {0:0,1:0,2:1,3:1,4:2,5:3,6:3,7:4,8:4,9:5,10:5,11:6};
  return Math.floor(midi/12)*7 + pcMap[midi%12];
}
// s=0 -> línea inferior del pentagrama (Mi4 = 64)
function staffPos(midi){ return diatonicIndex(midi) - diatonicIndex(64); }

function midiToTab(midi){
  let best = null;
  for(let s=0; s<TUNING.length; s++){
    const fret = midi - TUNING[s];
    if(fret < 0 || fret > 15) continue;
    if(best === null || fret < best.fret) best = { string:s, fret };
  }
  if(!best) best = { string:0, fret: Math.max(0, midi-64) };
  return best;
}

// Frases melódicas en La menor / Do mayor. [midi, durBeats], midi=0 -> silencio
const A=57,B=59,C=60,D=62,E=64,F=65,G=67,A4=69,B4=71,C5=72,D5=74,E5=76;
const PHRASES = [
  [[E,1],[G,1],[A4,1],[B4,1],[C5,2],[B4,1],[A4,1]],
  [[G,1.5],[A4,.5],[B4,1],[A4,1],[G,2],[E,1],[D,1]],
  [[C,1],[E,1],[G,1],[E,1],[A4,2],[G,1],[F,1]],
  [[E,2],[D,1],[C,1],[D,1.5],[E,.5],[G,1],[E,1]],
  [[A4,1],[C5,1],[B4,1],[A4,1],[G,1],[E,1],[D,2]],
  [[C,2],[D,1],[E,1],[F,1],[E,1],[D,1],[C,1]],
];

function buildScore(){
  const notes = [];
  let beat = 0;
  // secciones que repiten frases con leve variación → longitud de canción real
  const plan = [0,1,2,3, 0,1,4,5, 2,3,4,5, 0,2,1,5,
                0,1,2,3, 4,5,0,1, 2,3,0,5, 4,1,2,3];
  plan.forEach((pi, si) => {
    const phrase = PHRASES[pi];
    const transpose = (si % 4 === 3) ? 0 : 0; // mantener tonalidad estable
    phrase.forEach(([m, dur]) => {
      if(m !== 0){
        const midi = m + transpose;
        notes.push({
          beat, dur, midi,
          s: staffPos(midi),
          tab: midiToTab(midi),
        });
      }
      beat += dur;
    });
  });
  return { notes, totalBeats: beat };
}

const SCORE = buildScore();

/* ============================================================
   Afiliados gestionados por el admin (localStorage)
   Cada item: { id, title, price, url, image, platform, instrument }
   ============================================================ */
const AFF_LS = "cordeband_affiliates_v1";
function loadAdminAffiliates(){
  try { return JSON.parse(localStorage.getItem(AFF_LS)) || []; } catch(e){ return []; }
}
function saveAdminAffiliates(list){
  try { localStorage.setItem(AFF_LS, JSON.stringify(list)); } catch(e){}
}
/* Lo que ve el reproductor: si el admin cargó productos para este instrumento
   (o "all"), se usan esos; si no, caen los de ejemplo. */
function getAffiliates(instrument){
  const admin = loadAdminAffiliates().filter(a => a.active !== false);
  const matched = admin.filter(a => a.instrument === instrument || a.instrument === "all");
  if(matched.length) return matched;
  return AFFILIATES[instrument] || AFFILIATES.guitar;
}

Object.assign(window, {
  INSTRUMENTS, INST_ORDER, LIBRARY, AFFILIATES, STEMS,
  SCORE, TUNING, staffPos, midiToTab,
  stemsMsLeft, stemsExpired,
  loadAdminAffiliates, saveAdminAffiliates, getAffiliates,
  loadFeatured, saveFeatured, publishedFeatured, DEFAULT_FEATURED,
  makeRoomCode, SIM_MEMBERS,
});
