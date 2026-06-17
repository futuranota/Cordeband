'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import {
  STEMS, LIBRARY, SCORE, fmtTime, getAffiliates,
  INSTRUMENTS, type InstrumentKey, type Song, type AffiliateProduct,
} from '@/lib/data';
import { StagePanel } from '@/components/player/StagePanel';
import { SheetViewer } from '@/components/player/SheetViewer';
import {
  IconPlay, IconPause, IconArrow, IconArrowL, IconLoop, IconGauge, IconVolume, IconMute,
  IconWave, IconSpark, IconClock, IconCheck, IconReset, IconUpload, IconExternal, IconCart,
} from '@/components/ui/icons';

const SONG = LIBRARY[0];
const DEF_VOL: Record<string, number> = { vocals: 78, drums: 82, bass: 80, piano: 70, guitar: 76, other: 64 };
const PARTS_F: [number, number][] = [[0.06, 0.26], [0.34, 0.58], [0.68, 0.92]];
const LEAD_BEATS = 8;

const SCHED: Record<string, [number, number][]> = {
  drums: [[0.05, 1.0]],
  bass: [[0.11, 1.0]],
  guitar: [[0.06, 0.26], [0.34, 0.58], [0.68, 0.92]],
  piano: [[0.0, 0.30], [0.40, 0.66], [0.80, 1.0]],
  vocals: [[0.20, 0.42], [0.52, 0.72], [0.86, 1.0]],
  other: [[0.30, 0.70]],
};

const inWins = (wins: [number, number][], f: number) => wins.some(([a, b]) => f >= a && f < b);

function readInstrument(): InstrumentKey {
  if (typeof window === 'undefined') return 'guitar';
  const saved = localStorage.getItem('cordeband_instrument') as InstrumentKey | null;
  return saved && INSTRUMENTS[saved] ? saved : 'guitar';
}

function buildDefaultVols(inst: InstrumentKey): Record<string, number> {
  const v: Record<string, number> = {};
  STEMS.forEach((s) => {
    v[s.key] = s.key === inst ? 0 : (DEF_VOL[s.key] ?? 70);
  });
  return v;
}

function TempoControl({ tempo, setTempo }: { tempo: number; setTempo: (v: number) => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pct = Math.round(tempo * 100);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button type="button" className={`chip-btn${pct !== 100 ? ' on' : ''}`} onClick={() => setOpen((o) => !o)}>
        <IconGauge size={14} /> {pct}%
      </button>
      {open && (
        <div className="card pop">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{t('player.tempo')}</span>
            <span className="muted tnum" style={{ fontSize: 12.5 }}>{pct}%</span>
          </div>
          <input className="slider" type="range" min="50" max="150" step="5"
            value={pct} onChange={(e) => setTempo(Number(e.target.value) / 100)} />
          <div className="row spread" style={{ marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
            <span>50%</span><span>{t('player.sameTone')}</span><span>150%</span>
          </div>
          <div className="row gap-8" style={{ marginTop: 12 }}>
            {[75, 100, 125].map((v) => (
              <button key={v} type="button" className="chip-btn" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setTempo(v / 100)}>{v}%</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TurnBanner({ status, secsToEntry, yourTime }: {
  status: 'waiting' | 'ready' | 'live';
  secsToEntry: number | null;
  yourTime: number;
}) {
  const { t } = useT();

  if (status === 'live') {
    return (
      <div className="turn-banner live">
        <div className="turn-dot"><span className="eq"><i /><i /><i /><i /></span></div>
        <div className="turn-main">
          <div className="turn-title">{t('player.liveT')}</div>
          <div className="turn-sub">{t('player.liveS')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="turn-count">{fmtTime(yourTime)}</div>
          <div className="turn-sub" style={{ marginTop: 2 }}>{t('common.you')}</div>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="turn-banner ready">
        <div className="turn-dot"><IconSpark size={20} /></div>
        <div className="turn-main">
          <div className="turn-title">{t('player.readyT')}</div>
          <div className="turn-sub">{t('player.readyS')}</div>
        </div>
        <div className="turn-count">{secsToEntry != null ? Math.max(0, Math.ceil(secsToEntry)) : '–'}</div>
      </div>
    );
  }

  return (
    <div className="turn-banner waiting">
      <div className="turn-dot"><IconClock size={19} /></div>
      <div className="turn-main">
        <div className="turn-title">{t('player.waitT')}</div>
        <div className="turn-sub">{t('player.syncOff')}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="turn-sub">{t('player.waitNext')}</div>
        <div className="serif" style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginTop: 2 }}>
          {secsToEntry != null ? fmtTime(secsToEntry) : '—'}
        </div>
      </div>
    </div>
  );
}

function StemMixer({ song, instrument, vols, setVol }: {
  song: Song;
  instrument: InstrumentKey;
  vols: Record<string, number>;
  setVol: (k: string, v: number) => void;
}) {
  const { t } = useT();
  const stems = STEMS.filter((s) => song.instruments.includes(s.key));

  return (
    <div className="card mixer">
      <div className="row spread">
        <div className="row gap-8"><IconWave size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>{t('player.mixT')}</span></div>
        <span className="muted" style={{ fontSize: 12 }}>{t('player.mixSub')}</span>
      </div>
      <div className="mixer-grid">
        {stems.map((s) => {
          const Icon = s.Icon;
          const vol = vols[s.key] ?? 0;
          const muted = vol === 0;
          const isYou = s.key === instrument;
          return (
            <div key={s.key} className={`stem${muted ? ' is-muted' : ''}`}>
              <div className="stem-top">
                <span className="stem-name">
                  <span className="stem-ico"><Icon size={15} sw={1.5} /></span>
                  {t(`inst.${s.key}`)}{isYou && <span className="acc-text" style={{ fontSize: 11, fontWeight: 700 }}> · {t('common.you')}</span>}
                </span>
                <button type="button" className={`stem-mute${muted ? ' active' : ''}`}
                  onClick={() => setVol(s.key, muted ? (DEF_VOL[s.key] ?? 70) : 0)}>
                  {muted ? <IconMute size={16} /> : <IconVolume size={16} />}
                </button>
              </div>
              <input className="slider" type="range" min="0" max="100"
                value={vol} onChange={(e) => setVol(s.key, Number(e.target.value))} />
              <div className="stem-val">{vol}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AffiliateRail({ instrument, collapsed, onToggle, onClick }: {
  instrument: InstrumentKey;
  collapsed: boolean;
  onToggle: () => void;
  onClick: (p: AffiliateProduct) => void;
}) {
  const { t } = useT();
  const items = getAffiliates(instrument);

  if (collapsed) {
    return (
      <aside className="aff-rail collapsed">
        <button
          type="button"
          className="aff-tab"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={t('player.affShow')}
        >
          <IconArrowL size={16} />
          <span className="aff-tab-label">{t('player.affRec')}</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="aff-rail">
      <div className="aff-head">
        <div>
          <span className="eyebrow" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{t('player.affFor')} {t(`inst.${instrument}`).toLowerCase()}</span>
          <div className="serif" style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: '#fff' }}>{t('player.affRec')}</div>
        </div>
        <button
          type="button"
          className="aff-toggle iconbtn"
          onClick={onToggle}
          aria-expanded
          aria-label={t('player.affHide')}
          title={t('player.affHide')}
        >
          <IconArrow size={16} />
        </button>
      </div>
      <div className="aff-list">
        {items.map((p) => {
          const href = p.url || undefined;
          return (
            <a key={p.id} className="card aff-card" href={href}
              target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined}
              onClick={() => onClick(p)}>
              <div className="aff-thumb">
                {p.image
                  ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <IconCart size={20} />}
              </div>
              <div className="aff-info">
                <div className="aff-name">{p.title}</div>
                <div className="aff-cat">{p.platform}</div>
                <div className="aff-buy">
                  <span className="aff-price">{p.price}</span>
                  <span className="aff-go">{p.platform || 'Ver'} <IconExternal size={12} /></span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </aside>
  );
}

export function PlayerScreen() {
  const { t } = useT();
  const router = useRouter();
  const { user } = useSession();
  const S = SONG;
  const bpm = S.bpm || 84;
  const total = SCORE.totalBeats;

  const [instrument] = useState<InstrumentKey>(readInstrument);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [curBeat, setCurBeat] = useState(0);
  const [yourTime, setYourTime] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [view, setView] = useState<'staff' | 'tab' | 'roll'>('staff');
  const [loop, setLoop] = useState<{ a: number; b: number } | null>(null);
  const [pendingA, setPendingA] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [vols, setVols] = useState<Record<string, number>>(() => buildDefaultVols(readInstrument()));
  const [affCollapsed, setAffCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('cordeband_aff_collapsed') === '1',
  );

  const partsBeats = useMemo(() => PARTS_F.map(([a, b]) => ({ a: a * total, b: b * total })), [total]);
  const beatRef = useRef(0);
  const loopRef = useRef(loop);
  const tempoRef = useRef(tempo);
  const yourBeatsRef = useRef(0);
  const partsRef = useRef(partsBeats);
  const scrubRef = useRef<HTMLDivElement>(null);

  loopRef.current = loop;
  tempoRef.current = tempo;
  partsRef.current = partsBeats;

  useEffect(() => { beatRef.current = curBeat; }, [curBeat]);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const prev = beatRef.current;
      let b = prev + dt * (bpm / 60) * tempoRef.current;
      const lp = loopRef.current;
      if (lp && b >= lp.b) b = lp.a;
      if (b >= total) {
        b = 0;
        yourBeatsRef.current = 0;
        setYourTime(0);
        setPlaying(false);
      }
      const mid = (prev + b) / 2;
      if (partsRef.current.some((p) => mid >= p.a && mid < p.b) && b > prev) {
        yourBeatsRef.current += b - prev;
        setYourTime(yourBeatsRef.current * 60 / bpm);
      }
      beatRef.current = b;
      setCurBeat(b);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, bpm, total]);

  const inst = instrument;
  const instName = t(`inst.${inst}`);
  const setVol = (k: string, v: number) => setVols((p) => ({ ...p, [k]: v }));
  const curTime = curBeat * 60 / bpm;
  const totalTime = total * 60 / bpm;
  const ratio = curBeat / total;
  const rate = (bpm / 60) * tempo;

  let status: 'waiting' | 'ready' | 'live' = 'waiting';
  let curPart: { a: number; b: number } | null = null;
  let nextPart: { a: number; b: number } | null = null;

  for (const p of partsBeats) {
    if (curBeat >= p.a && curBeat < p.b) { curPart = p; break; }
  }
  if (curPart) {
    status = 'live';
  } else {
    nextPart = partsBeats.find((p) => p.a > curBeat) ?? null;
    if (nextPart) status = (nextPart.a - curBeat) <= LEAD_BEATS ? 'ready' : 'waiting';
  }

  const secsToEntry = nextPart ? (nextPart.a - curBeat) / rate : null;
  const isWaiting = status !== 'live';
  const showReadyCue = playing && status === 'ready' && secsToEntry != null && secsToEntry <= 4.4;
  const cueNum = showReadyCue ? Math.max(1, Math.ceil(secsToEntry)) : null;
  const justEntered = playing && curPart && (curBeat - curPart.a) < 0.9;

  const f = curBeat / total;
  const activeKeys = playing ? S.instruments.filter((k) => {
    if (k === inst) return !!curPart;
    return inWins(SCHED[k] ?? [], f);
  }) : [];

  const seek = (clientX: number) => {
    const el = scrubRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rt = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const b = rt * total;
    beatRef.current = b;
    setCurBeat(b);
  };

  const onScrubDown = (e: React.PointerEvent) => {
    seek(e.clientX);
    const move = (ev: PointerEvent) => seek(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const loopClick = () => {
    if (loop) { setLoop(null); setPendingA(null); return; }
    if (pendingA === null) { setPendingA(curBeat); return; }
    const a = Math.min(pendingA, curBeat);
    const b = Math.max(pendingA, curBeat);
    if (b - a < 1) { setPendingA(null); return; }
    setLoop({ a, b });
    setPendingA(null);
  };

  const loopLabel = loop ? t('player.loopOn') : pendingA !== null ? t('player.loopB') : t('player.loopOff');

  const showToast = (p: AffiliateProduct) => {
    setToast(`${p.platform} · ${p.title}`);
    setTimeout(() => setToast(null), 2600);
  };

  function toggleAff() {
    setAffCollapsed((c) => {
      const next = !c;
      localStorage.setItem('cordeband_aff_collapsed', next ? '1' : '0');
      return next;
    });
  }

  const downloadMp3 = () => {
    if (!user) { router.push('/signup'); return; }
    setToast(`${t('player.dlPrep')} ${instName}…`);
    setTimeout(() => setToast(`${t('player.dlReady')} Cordeband — ${S.title} (–${instName}).mp3`), 1700);
  };

  return (
    <main className="wrap app-main page">
      <Link href="/instrument" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
        <IconArrowL size={15} /> {t('player.changeInst')}
      </Link>

      <div className="player" data-aff="side" data-aff-collapsed={affCollapsed ? 'true' : undefined}>
        <section className="stage">
          <div className="player-head">
            <div className="now-playing">
              <div className="np-title">{S.title}</div>
              <div className="np-meta">
                <span>{S.artist}</span><span style={{ opacity: 0.4 }}>·</span>
                <span className="muted-tag"><span className="dot" />{instName} {t('player.muted')}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{S.bpm} BPM · {S.keySig}</span>
              </div>
            </div>
            <div className="viewtoggle">
              {([['staff', t('player.staff')], ['tab', t('player.tab')], ['roll', t('player.roll')]] as const).map(([k, l]) => (
                <button key={k} type="button" className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>
              ))}
            </div>
          </div>

          <StagePanel
            instruments={S.instruments}
            youKey={inst}
            activeKeys={activeKeys}
            title={t('sel.stageTitle')}
            sub={t('sel.stageSub')}
          />

          <TurnBanner status={status} secsToEntry={secsToEntry} yourTime={yourTime} />

          <SheetViewer
            view={view}
            curBeat={curBeat}
            loop={loop}
            loading={loading}
            waiting={isWaiting && !loading && playing}
            waitLabel={t('player.waitOverlay')}
          />

          <div className="card transport">
            <div className="transport-row">
              <button type="button" className="play-btn" disabled={loading}
                onClick={() => setPlaying((p) => !p)}>
                {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
              </button>
              <span className="time">{fmtTime(curTime)}</span>
              <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                <div className="scrub-track">
                  {partsBeats.map((p, i) => (
                    <div key={i} className="scrub-parts" style={{ left: `${p.a / total * 100}%`, width: `${(p.b - p.a) / total * 100}%` }} />
                  ))}
                  {loop && <div className="scrub-loop" style={{ left: `${loop.a / total * 100}%`, width: `${(loop.b - loop.a) / total * 100}%` }} />}
                  <div className="scrub-fill" style={{ width: `${ratio * 100}%` }} />
                </div>
                <div className="scrub-head" style={{ left: `${ratio * 100}%` }} />
              </div>
              <span className="time" style={{ textAlign: 'right' }}>{fmtTime(totalTime)}</span>
            </div>
            <div className="mini-ctrl" style={{ marginTop: 14, flexWrap: 'wrap' }}>
              <TempoControl tempo={tempo} setTempo={setTempo} />
              <button type="button" className={`chip-btn${loop || pendingA !== null ? ' on' : ''}`} onClick={loopClick}>
                <IconLoop size={14} /> {loopLabel}
              </button>
              {(loop || pendingA !== null) && (
                <button type="button" className="chip-btn" onClick={() => { setLoop(null); setPendingA(null); }}>{t('player.remove')}</button>
              )}
              <button type="button" className="chip-btn" onClick={() => { beatRef.current = 0; setCurBeat(0); yourBeatsRef.current = 0; setYourTime(0); }}>
                <IconReset size={14} /> {t('player.restart')}
              </button>
              <div className="grow" />
              <button type="button" className="btn btn-primary btn-sm" onClick={downloadMp3}>
                <IconUpload size={14} style={{ transform: 'rotate(180deg)' }} /> {t('player.download')}
              </button>
            </div>
          </div>

          <StemMixer song={S} instrument={inst} vols={vols} setVol={setVol} />
        </section>

        {!affCollapsed && (
          <AffiliateRail
            instrument={inst}
            collapsed={false}
            onToggle={toggleAff}
            onClick={showToast}
          />
        )}
      </div>

      {affCollapsed && (
        <AffiliateRail
          instrument={inst}
          collapsed
          onToggle={toggleAff}
          onClick={showToast}
        />
      )}

      {showReadyCue && (
        <div className="cue">
          <span className="cue-n">{cueNum}</span>
          <span className="cue-t">{t('player.cueReady')} {cueNum}…</span>
        </div>
      )}
      {!showReadyCue && justEntered && (
        <div className="cue go">
          <span className="cue-n">▶</span>
          <span className="cue-t">{t('player.cueGo')}</span>
        </div>
      )}

      {toast && <div className="toast"><IconCheck size={15} sw={2.2} />{toast}</div>}
    </main>
  );
}
