'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import {
  STEMS, LIBRARY, SCORE, fmtTime, getAffiliates,
  INSTRUMENTS, type InstrumentKey, type Song, type AffiliateProduct,
} from '@/lib/data';
import { DEMO_BAND_MEMBERS } from '@/lib/demo-band';
import { toUiBandMember, memberDisplayName, viewerMember } from '@/lib/band-room';
import {
  canTogglePlayerMode,
  resolveBandView,
  type PlayerViewMode,
} from '@/lib/plan-access';
import {
  activeInstrumentsAt,
  DEMO_ENTRY_SCHEDULE_FRACTIONS,
  DEMO_YOUR_PART_FRACTIONS,
  fractionsToBeatWindows,
  LEAD_BEATS_DEFAULT,
  viewerPartStatus,
} from '@/lib/band-schedule';
import { normalizePlan } from '@/lib/supabase/profile';
import { StagePanel } from '@/components/player/StagePanel';
import { SheetViewer } from '@/components/player/SheetViewer';
import { BandSessionPanel } from '@/components/player/BandSessionPanel';
import { BandTurnOverlay } from '@/components/player/BandTurnOverlay';
import { BandTimeline } from '@/components/player/BandTimeline';
import { useBandTurnOverlay } from '@/hooks/useBandTurnOverlay';
import { useBandRoom } from '@/hooks/useBandRoom';
import { useBandSync } from '@/hooks/useBandSync';
import {
  buildDemoBandRoom,
  buildDemoBandViewer,
  demoBandLeaderName,
  demoBandMembersAsRows,
} from '@/lib/demo-band-room';
import { buildTimelineLanes } from '@/lib/band-timeline';
import {
  IconPlay, IconPause, IconArrow, IconArrowL, IconLoop, IconGauge, IconVolume, IconMute,
  IconWave, IconSpark, IconClock, IconCheck, IconReset, IconUpload, IconExternal, IconCart,
  IconCrown, IconBand, IconRotate,
} from '@/components/ui/icons';

const SONG = LIBRARY[0];
const DEF_VOL: Record<string, number> = { vocals: 78, drums: 82, bass: 80, piano: 70, guitar: 76, other: 64 };

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

export function PlayerScreen({ initialDemoMode = 'solo' }: { initialDemoMode?: PlayerViewMode }) {
  return (
    <Suspense fallback={null}>
      <PlayerScreenInner initialDemoMode={initialDemoMode} />
    </Suspense>
  );
}

function PlayerScreenInner({ initialDemoMode }: { initialDemoMode: PlayerViewMode }) {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useSession();
  const S = SONG;
  const bpm = S.bpm || 84;
  const total = SCORE.totalBeats;

  const [instrument, setInstrument] = useState<InstrumentKey>('guitar');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [curBeat, setCurBeat] = useState(0);
  const [yourTime, setYourTime] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [view, setView] = useState<'staff' | 'tab' | 'roll'>('staff');
  const [loop, setLoop] = useState<{ a: number; b: number } | null>(null);
  const [pendingA, setPendingA] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [vols, setVols] = useState<Record<string, number>>(() => buildDefaultVols('guitar'));
  const [affCollapsed, setAffCollapsed] = useState(false);
  const [bandPlayStartedAt, setBandPlayStartedAt] = useState<string | null>(null);

  const isDemo = !user;
  const plan = normalizePlan(profile?.plan);
  const showModeToggle = canTogglePlayerMode({ isDemo, plan });
  const bandRoomQueryId = searchParams.get('room');
  const bandRoomQueryCode = searchParams.get('code');
  const hasRoomSession = !!(bandRoomQueryId || bandRoomQueryCode);
  const [viewMode, setViewMode] = useState<PlayerViewMode>(initialDemoMode);
  const isBandView = resolveBandView({ isDemo, plan, viewMode, roomSession: hasRoomSession });
  const leaderInstrument: InstrumentKey = 'guitar';
  const liveBandSession = isBandView && !!user;

  const bandRoom = useBandRoom({
    enabled: liveBandSession,
    userId: user?.id ?? null,
    instrument: instrument,
    songId: SONG.id,
    roomId: bandRoomQueryId,
    roomCode: bandRoomQueryCode,
  });

  const bandSync = useBandSync({
    enabled: liveBandSession && bandRoom.isLive,
    room: bandRoom.room,
    bpm,
    tempo,
    totalBeats: total,
  });

  const useLocalBandClock = !liveBandSession || bandRoom.useDemoFallback;

  useEffect(() => {
    const savedInst = readInstrument();
    setInstrument(savedInst);
    setVols(buildDefaultVols(savedInst));
    if (localStorage.getItem('cordeband_aff_collapsed') === '1') {
      setAffCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (!canTogglePlayerMode({ isDemo, plan })) {
      setViewMode('solo');
      return;
    }
    if (isDemo) {
      const demo = searchParams.get('demo');
      if (demo === 'banda' || demo === 'solo') {
        setViewMode(demo === 'banda' ? 'banda' : 'solo');
      }
    }
  }, [searchParams, isDemo, plan]);

  const yourWindows = useMemo(
    () => fractionsToBeatWindows(DEMO_YOUR_PART_FRACTIONS, total),
    [total],
  );
  const viewerWindows = useMemo(() => {
    if (!isBandView) return yourWindows;
    const fractions = DEMO_ENTRY_SCHEDULE_FRACTIONS[instrument] ?? [];
    return fractionsToBeatWindows(fractions, total);
  }, [isBandView, instrument, total, yourWindows]);
  const partWindows = isBandView ? viewerWindows : yourWindows;
  const beatRef = useRef(0);
  const loopRef = useRef(loop);
  const tempoRef = useRef(tempo);
  const yourBeatsRef = useRef(0);
  const partsRef = useRef(partWindows);
  const scrubRef = useRef<HTMLDivElement>(null);

  loopRef.current = loop;
  tempoRef.current = tempo;
  partsRef.current = partWindows;

  useEffect(() => { beatRef.current = curBeat; }, [curBeat]);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!playing || (isBandView && !useLocalBandClock)) return;
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
      if (partsRef.current.some((p) => mid >= p.startBeat && mid < p.endBeat) && b > prev) {
        yourBeatsRef.current += b - prev;
        setYourTime(yourBeatsRef.current * 60 / bpm);
      }
      beatRef.current = b;
      setCurBeat(b);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, bpm, total, isBandView, useLocalBandClock]);

  const effectivePlaying = isBandView && !useLocalBandClock
    ? bandRoom.room?.status === 'playing'
    : playing;

  const effectiveCurBeat = isBandView && !useLocalBandClock
    ? bandSync.curBeat
    : curBeat;

  const syncReady = !isBandView || useLocalBandClock || bandSync.synced;

  const inst = instrument;
  const instName = t(`inst.${inst}`);
  const setVol = (k: string, v: number) => setVols((p) => ({ ...p, [k]: v }));
  const curTime = effectiveCurBeat * 60 / bpm;
  const totalTime = total * 60 / bpm;
  const ratio = effectiveCurBeat / total;
  const rate = (bpm / 60) * tempo;

  const { status, curPart, nextPart } = viewerPartStatus(effectiveCurBeat, partWindows, LEAD_BEATS_DEFAULT);

  const secsToEntry = nextPart ? (nextPart.startBeat - effectiveCurBeat) / rate : null;
  const isWaiting = status !== 'live';
  const showReadyCue = effectivePlaying && status === 'ready' && secsToEntry != null && secsToEntry <= 4.4;
  const cueNum = showReadyCue ? Math.max(1, Math.ceil(secsToEntry)) : null;
  const justEntered = effectivePlaying && curPart && (effectiveCurBeat - curPart.startBeat) < 0.9;

  const activeKeys = effectivePlaying && syncReady
    ? isBandView
      ? activeInstrumentsAt(effectiveCurBeat, total, DEMO_ENTRY_SCHEDULE_FRACTIONS, S.instruments)
      : activeInstrumentsAt(effectiveCurBeat, total, DEMO_ENTRY_SCHEDULE_FRACTIONS, S.instruments, {
          yourInstrument: inst,
          yourPartFractions: DEMO_YOUR_PART_FRACTIONS,
        })
    : [];

  const rosterMembers = useMemo(() => {
    if (bandRoom.isLive && bandRoom.room) {
      const hostId = bandRoom.room.host_id;
      return bandRoom.members.map((m) =>
        toUiBandMember(m, hostId, activeKeys, effectivePlaying),
      );
    }
    return DEMO_BAND_MEMBERS.map((m) => ({
      ...m,
      playing: effectivePlaying ? activeKeys.includes(m.instrument) : false,
    }));
  }, [bandRoom.isLive, bandRoom.room, bandRoom.members, activeKeys, effectivePlaying]);

  const memberLabels = useMemo(() => {
    if (!isBandView) return undefined;
    const labels: Partial<Record<InstrumentKey, string>> = {};
    for (const m of rosterMembers) {
      if (m.active) labels[m.instrument] = m.name;
    }
    return labels;
  }, [isBandView, rosterMembers]);

  const timelineLanes = useMemo(() => {
    if (!isBandView) return [];
    return buildTimelineLanes(rosterMembers, total);
  }, [isBandView, rosterMembers, total]);

  const liveLeaderInstrument = useMemo(() => {
    if (bandRoom.isLive && bandRoom.room) {
      const leader = bandRoom.members.find(
        (m) => m.is_leader || m.user_id === bandRoom.room!.host_id,
      );
      if (leader) return leader.instrument;
    }
    return leaderInstrument;
  }, [bandRoom.isLive, bandRoom.room, bandRoom.members]);

  const overlayRoom = bandRoom.isLive && bandRoom.room
    ? {
        status: bandRoom.room.status,
        playStartedAt: bandRoom.room.play_started_at,
        leaderName: bandRoom.leaderName,
      }
    : {
        ...buildDemoBandRoom({
          playing: isBandView && effectivePlaying,
          playStartedAt: bandPlayStartedAt,
        }),
        leaderName: demoBandLeaderName(),
      };

  const liveViewerMember = bandRoom.isLive ? viewerMember(bandRoom.members, user?.id ?? null) : null;
  const viewerName = liveViewerMember
    ? memberDisplayName(liveViewerMember)
    : profile?.full_name?.trim() || t('band.you');
  const viewerInstrument = liveViewerMember?.instrument ?? inst;

  const bandOverlayState = useBandTurnOverlay({
    room: overlayRoom,
    members: bandRoom.isLive ? bandRoom.memberRows : demoBandMembersAsRows(),
    viewer: buildDemoBandViewer({
      name: viewerName,
      instrument: viewerInstrument,
      isLeader: bandRoom.isLeader,
    }),
    playback: {
      playing: isBandView && effectivePlaying,
      curBeat: effectiveCurBeat,
      totalBeats: total,
      bpm,
      tempo,
      yourTime,
    },
    presentInstruments: S.instruments,
  });

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

  async function togglePlaying() {
    if (liveBandSession && bandRoom.isLive && bandRoom.room) {
      if (!bandRoom.isLeader) return;
      const action = bandRoom.room.status === 'playing' ? 'pause' : 'play';
      try {
        await fetch(`/api/band-rooms/${bandRoom.room.id}/play`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      } catch {
        setToast(t('room.waitingLeader'));
        setTimeout(() => setToast(null), 2600);
      }
      return;
    }

    setPlaying((p) => {
      const next = !p;
      if (isBandView && useLocalBandClock) {
        if (next) setBandPlayStartedAt(new Date().toISOString());
        else setBandPlayStartedAt(null);
      }
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
      <div className="player-top">
        <div className="player-top-row">
          <Link href="/instrument" className="btn btn-ghost btn-sm">
            <IconArrowL size={15} /> {t('player.changeInst')}
          </Link>

          {showModeToggle ? (
            <div className="player-mode-stack">
              <div className="demo-mode-toggle" role="tablist" aria-label={t('bandDemo.toggleLabel')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'solo'}
                  className={viewMode === 'solo' ? 'on' : ''}
                  onClick={() => setViewMode('solo')}
                >
                  <IconCrown size={14} />
                  {t('bandDemo.solo')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'banda'}
                  className={viewMode === 'banda' ? 'on' : ''}
                  onClick={() => setViewMode('banda')}
                >
                  <IconBand size={14} />
                  {t('bandDemo.banda')}
                </button>
              </div>
              <div className="player-rotate-hint" role="note">
                <IconRotate size={18} />
                <span>{t('player.rotateScreen')}</span>
              </div>
            </div>
          ) : (
            <div className="player-rotate-hint player-rotate-hint--inline" role="note">
              <IconRotate size={18} />
              <span>{t('player.rotateScreen')}</span>
            </div>
          )}
        </div>
      </div>

      {isBandView ? (
        <div className="player-band-layout">
          <aside className="band-player-roster" aria-label={t('bandDemo.roster')}>
            <BandSessionPanel
              members={rosterMembers}
              activeInstruments={effectivePlaying ? activeKeys : []}
              leaderInstrument={liveLeaderInstrument}
              playing={effectivePlaying}
            />
          </aside>

          <div className="player-band-main">
            <BandTurnOverlay state={bandOverlayState} />
            <section className="stage">
              <div className="band-leader-head">
                <span className="eyebrow" style={{ fontSize: 10 }}>{t('bandDemo.leaderPanel')}</span>
                <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 16 }}>{t('bandDemo.leaderSub')}</p>
              </div>

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
                memberLabels={memberLabels}
                title={t('bandDemo.stageTitle')}
                sub={t('bandDemo.stageSub')}
              />

              <BandTimeline
                lanes={timelineLanes}
                totalBeats={total}
                curBeat={effectiveCurBeat}
                youInstrument={inst}
              />

              <SheetViewer
                view={view}
                curBeat={effectiveCurBeat}
                loop={loop}
                loading={loading}
                waiting={isWaiting && !loading && effectivePlaying}
                waitLabel={t('player.waitOverlay')}
              />

              <div className="card transport">
                <div className="transport-row">
                  <button
                    type="button"
                    className="play-btn"
                    disabled={loading || (liveBandSession && bandRoom.isLive && !bandRoom.isLeader)}
                    onClick={togglePlaying}
                    title={liveBandSession && bandRoom.isLive && !bandRoom.isLeader ? t('room.waitingLeader') : undefined}
                  >
                    {effectivePlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                  </button>
                  <span className="time">{fmtTime(curTime)}</span>
                  <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                    <div className="scrub-track">
                      {viewerWindows.map((p, i) => (
                        <div key={i} className="scrub-parts" style={{ left: `${p.startBeat / total * 100}%`, width: `${(p.endBeat - p.startBeat) / total * 100}%` }} />
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
          </div>
        </div>
      ) : (
        <div
          className="player"
          data-aff="side"
          data-aff-collapsed={affCollapsed ? 'true' : undefined}
        >
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
                  onClick={togglePlaying}>
                  {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
                </button>
                <span className="time">{fmtTime(curTime)}</span>
                <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                  <div className="scrub-track">
                    {yourWindows.map((p, i) => (
                      <div key={i} className="scrub-parts" style={{ left: `${p.startBeat / total * 100}%`, width: `${(p.endBeat - p.startBeat) / total * 100}%` }} />
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
      )}

      {!isBandView && affCollapsed && (
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
