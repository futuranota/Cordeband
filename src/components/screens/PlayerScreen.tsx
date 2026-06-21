'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/i18n/context';
import { useSession } from '@/contexts/SessionContext';
import {
  STEMS, LIBRARY, SCORE, fmtTime, getAffiliates, stemTracksFor,
  INSTRUMENTS, type InstrumentKey, type Song, type AffiliateProduct,
} from '@/lib/data';
import { fetchSongById, readActiveSongId, readInstrumentConfirmedFor, saveActiveSongId, saveInstrumentConfirmedFor } from '@/lib/supabase/fetch-song';
import { fetchSongScore, type SongScore } from '@/lib/supabase/fetch-song-score';
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
import { isYourTurnAt, windowsFromNotes } from '@/lib/note-turn-schedule';
import { normalizePlan } from '@/lib/supabase/profile';
import type { LocalBusiness } from '@/types/database';
import { StagePanel } from '@/components/player/StagePanel';
import { DetectedInstrumentsBanner } from '@/components/instruments/DetectedInstrumentsBanner';
import type { InstrumentDetectionMode } from '@/lib/instrument-detection';
import { instrumentBannerKeys } from '@/lib/instrument-detection';
import { SheetViewer } from '@/components/player/SheetViewer';
import { AlphaTabViewer } from '@/components/player/AlphaTabViewer';
import { BandSessionPanel } from '@/components/player/BandSessionPanel';
import { BandTurnOverlay } from '@/components/player/BandTurnOverlay';
import { BandTimeline } from '@/components/player/BandTimeline';
import { SoloPracticeTimeline } from '@/components/player/SoloPracticeTimeline';
import { LyricsViewer } from '@/components/player/LyricsViewer';
import { ScoreSourceBadge } from '@/components/player/ScoreSourceBadge';
import { isScoreUnavailable } from '@/lib/score-quality';
import { useBandTurnOverlay } from '@/hooks/useBandTurnOverlay';
import { useBandRoom } from '@/hooks/useBandRoom';
import { useBandSync } from '@/hooks/useBandSync';
import { useBandAudioFollow } from '@/hooks/useBandAudioFollow';
import { usePlayerAudio, STEM_DEF_VOL } from '@/hooks/usePlayerAudio';
import { notesToAlphaTex } from '@/lib/alphatab/notes-to-alphatex';
import {
  buildDemoBandRoom,
  buildDemoBandViewer,
  demoBandLeaderName,
  demoBandMembersAsRows,
} from '@/lib/demo-band-room';
import { buildTimelineLanes } from '@/lib/band-timeline';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import {
  IconPlay, IconPause, IconArrow, IconArrowL, IconLoop, IconGauge, IconVolume, IconMute,
  IconWave, IconSpark, IconClock, IconCheck, IconReset, IconUpload, IconExternal, IconCart,
  IconCrown, IconBand, IconRotate,
} from '@/components/ui/icons';

const DEMO_SONG = LIBRARY[0];

function readInstrument(): InstrumentKey {
  if (typeof window === 'undefined') return 'guitar';
  const saved = localStorage.getItem('cordeband_instrument') as InstrumentKey | null;
  return saved && INSTRUMENTS[saved] ? saved : 'guitar';
}

function buildDefaultVols(_inst: InstrumentKey, stemKeys?: InstrumentKey[]): Record<string, number> {
  const keys = stemKeys?.length ? stemKeys : STEMS.map((s) => s.key);
  const v: Record<string, number> = {};
  for (const key of keys) {
    v[key] = STEM_DEF_VOL[key] ?? 70;
  }
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

function StemMixer({
  availableStems,
  instrument,
  vols,
  setVol,
}: {
  availableStems: InstrumentKey[];
  instrument: InstrumentKey;
  vols: Record<string, number>;
  setVol: (k: string, v: number) => void;
}) {
  const { t } = useT();
  const stems = stemTracksFor(availableStems);

  return (
    <div className="card mixer">
      <div className="row spread">
        <div className="row gap-8"><IconWave size={16} /> <span style={{ fontWeight: 700, fontSize: 14 }}>{t('player.mixT')}</span></div>
        <span className="muted" style={{ fontSize: 12 }}>{t('player.mixSub')}</span>
      </div>
      <div className="mixer-grid">
        {stems.map((s) => {
          const Icon = s.Icon;
          const vol = vols[s.key] ?? STEM_DEF_VOL[s.key] ?? 70;
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
                  onClick={() => setVol(s.key, muted ? (STEM_DEF_VOL[s.key] ?? 70) : 0)}>
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

function PlayerBottom({
  displayInstruments,
  inst,
  activeKeys,
  memberLabels,
  stageTitle,
  stageSub,
  detectionMode,
  vols,
  setVol,
  scoreFromDb,
  reprocessing,
  onReprocess,
}: {
  displayInstruments: InstrumentKey[];
  inst: InstrumentKey;
  activeKeys?: InstrumentKey[];
  memberLabels?: Partial<Record<InstrumentKey, string>>;
  stageTitle: string;
  stageSub: string;
  detectionMode: InstrumentDetectionMode;
  vols: Record<string, number>;
  setVol: (k: string, v: number) => void;
  scoreFromDb: boolean;
  reprocessing: boolean;
  onReprocess?: () => void;
}) {
  const { t } = useT();
  const bannerKeys = instrumentBannerKeys(detectionMode);

  return (
    <div className="player-bottom">
      {displayInstruments.length > 0 && (
        <DetectedInstrumentsBanner
          instruments={displayInstruments}
          titleKey={bannerKeys.titleKey}
          subKey={bannerKeys.subKey}
        />
      )}
      {!scoreFromDb && onReprocess && !isScoreUnavailable(inst) && (
        <div className="card" style={{ marginBottom: 12, padding: '14px 16px' }}>
          <p className="muted" style={{ margin: '0 0 10px', fontSize: 13.5 }}>{t('player.scoreEmpty')}</p>
          <button type="button" className="btn btn-primary btn-sm" disabled={reprocessing} onClick={onReprocess}>
            {reprocessing ? t('player.reprocessing') : t('player.reprocess')}
          </button>
        </div>
      )}
      <StagePanel
        instruments={displayInstruments}
        youKey={inst}
        activeKeys={activeKeys}
        memberLabels={memberLabels}
        title={stageTitle}
        sub={stageSub}
      />
      <StemMixer
        availableStems={displayInstruments}
        instrument={inst}
        vols={vols}
        setVol={setVol}
      />
    </div>
  );
}

function AffiliateRail({ instrument, collapsed, onToggle, onClick, localBusinesses }: {
  instrument: InstrumentKey;
  collapsed: boolean;
  onToggle: () => void;
  onClick: (p: AffiliateProduct) => void;
  localBusinesses: LocalBusiness[];
}) {
  const { t } = useT();
  const items = getAffiliates(instrument);
  const hasLocal = localBusinesses.length > 0;
  const hasAffiliates = items.length > 0;
  const hasContent = hasLocal || hasAffiliates;

  if (collapsed) {
    if (!hasContent) return null;
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

  if (!hasContent) return null;

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
        {hasLocal && (
          <>
            <div className="eyebrow" style={{ fontSize: 11, padding: '0 4px 8px', color: 'rgba(255,255,255,0.65)' }}>
              {t('player.localBiz')}
            </div>
            {localBusinesses.map((biz) => {
              const href = biz.maps_url || undefined;
              return (
                <a
                  key={biz.id}
                  className="card aff-card"
                  href={href}
                  target={href ? '_blank' : undefined}
                  rel={href ? 'noopener noreferrer' : undefined}
                >
                  <div className="aff-thumb">
                    {biz.banner_url
                      ? <img src={biz.banner_url} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <IconCart size={20} />}
                  </div>
                  <div className="aff-info">
                    <div className="aff-name">{biz.name}</div>
                    <div className="aff-cat">{biz.city}{biz.postal_code ? ` · ${biz.postal_code}` : ''}</div>
                    {biz.description && (
                      <div className="aff-cat" style={{ marginTop: 4 }}>{biz.description}</div>
                    )}
                    {href && (
                      <div className="aff-buy">
                        <span className="aff-go">{t('player.localBizMaps')} <IconExternal size={12} /></span>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </>
        )}
        {hasAffiliates && hasLocal && (
          <div className="eyebrow" style={{ fontSize: 11, padding: '16px 4px 8px', color: 'rgba(255,255,255,0.65)' }}>
            {t('player.affRec')}
          </div>
        )}
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
  const { user, profile, isAdmin } = useSession();

  const [song, setSong] = useState<Song | null>(null);
  const [score, setScore] = useState<SongScore>({ notes: SCORE.notes, totalBeats: SCORE.totalBeats, fromDb: false });
  const [songLoading, setSongLoading] = useState(true);

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
  const [localBusinesses, setLocalBusinesses] = useState<LocalBusiness[]>([]);
  const [bandPlayStartedAt, setBandPlayStartedAt] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<InstrumentDetectionMode>('auto');
  const [reprocessing, setReprocessing] = useState(false);

  const isDemo = !user;
  const plan = isAdmin ? 'banda' : normalizePlan(profile?.plan);
  const showModeToggle = canTogglePlayerMode({ isDemo, plan });
  const bandRoomQueryId = searchParams.get('room');
  const bandRoomQueryCode = searchParams.get('code');
  const hasRoomSession = !!(bandRoomQueryId || bandRoomQueryCode);
  const [viewMode, setViewMode] = useState<PlayerViewMode>(initialDemoMode);
  const isBandView = resolveBandView({ isDemo, plan, viewMode, roomSession: hasRoomSession });
  const useDemoTurns = isDemo || isBandView;
  const useScoreTurns = !isDemo && !isBandView && score.fromDb && score.notes.length > 0;
  const useTurnUI = useDemoTurns || useScoreTurns;
  const leaderInstrument: InstrumentKey = 'guitar';
  const liveBandSession = isBandView && !!user && hasRoomSession;

  const paramSongId = searchParams.get('songId');
  const storedSongId = isDemo ? DEMO_SONG.id : readActiveSongId();

  const bandRoom = useBandRoom({
    enabled: liveBandSession,
    userId: user?.id ?? null,
    instrument: instrument,
    songId: paramSongId ?? storedSongId,
    roomId: bandRoomQueryId,
    roomCode: bandRoomQueryCode,
  });

  const resolvedSongId =
    bandRoom.room?.song_id
    ?? paramSongId
    ?? (isDemo ? DEMO_SONG.id : storedSongId);

  const S = song ?? DEMO_SONG;
  const bpm = S.bpm || 84;
  const scoreTotalBeats = isDemo ? SCORE.totalBeats : (score.fromDb ? score.totalBeats : 0);
  const durationBeats = S.duration > 0 ? (S.duration * bpm) / 60 : 0;
  const fallbackTotal = Math.max(
    isDemo ? SCORE.totalBeats : (durationBeats > 0 ? durationBeats : scoreTotalBeats),
    1,
  );

  const useLocalBandClock = !liveBandSession || bandRoom.useDemoFallback;
  const useRealAudio = !isDemo && !!resolvedSongId;

  const audio = usePlayerAudio({
    enabled: useRealAudio,
    songId: resolvedSongId,
    bpm,
    totalBeats: scoreTotalBeats,
    durationSeconds: S.duration,
    instrument,
    vols,
    tempo,
    loop,
  });

  const total = useRealAudio ? audio.playbackLimitBeats : fallbackTotal;

  const displayInstruments = useMemo(() => {
    if (useRealAudio && audio.loadedStems.length) return audio.loadedStems;
    return S.instruments;
  }, [useRealAudio, audio.loadedStems, S.instruments]);

  const soloPlaying = useRealAudio ? audio.playing : playing;
  const soloCurBeat = useRealAudio ? audio.curBeat : curBeat;
  const soloCurTimeSec = useRealAudio ? audio.curTimeSec : curBeat * 60 / bpm;
  const displayLoading = isDemo ? loading : (useRealAudio ? audio.audioLoading : false);

  const alphaTex = useMemo(() => {
    if (isDemo || !score.fromDb) return null;
    try {
      return notesToAlphaTex(S.title, bpm, instrument, score.notes);
    } catch {
      return null;
    }
  }, [isDemo, score.fromDb, score.notes, S.title, bpm, instrument]);

  const useAlphaTab = !isDemo && score.fromDb && !!alphaTex;

  const bandSync = useBandSync({
    enabled: liveBandSession && bandRoom.isLive,
    room: bandRoom.room,
    bpm,
    tempo,
    totalBeats: total,
  });

  useBandAudioFollow({
    enabled: liveBandSession && bandRoom.isLive && !bandRoom.useDemoFallback && useRealAudio,
    roomStatus: bandRoom.room?.status,
    synced: bandSync.synced,
    syncBeat: bandSync.curBeat,
    bpm,
    audio,
  });

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/processing-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.detectionMode === 'auto' || data.detectionMode === 'manual') {
          setDetectionMode(data.detectionMode);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const savedInst = readInstrument();
    setInstrument(savedInst);
    setVols(buildDefaultVols(savedInst));
    if (localStorage.getItem('cordeband_aff_collapsed') === '1') {
      setAffCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setLocalBusinesses([]);
      return;
    }
    let cancelled = false;
    fetch('/api/recommendations/local')
      .then((res) => (res.ok ? res.json() : { businesses: [] }))
      .then((data) => {
        if (!cancelled) setLocalBusinesses(data.businesses ?? []);
      })
      .catch(() => {
        if (!cancelled) setLocalBusinesses([]);
      });
    return () => { cancelled = true; };
  }, [user, profile?.city, profile?.postal_code]);

  useEffect(() => {
    if (!useRealAudio || !audio.loadedStems.length) return;
    setVols(buildDefaultVols(instrument, audio.loadedStems));
  }, [useRealAudio, instrument, audio.loadedStems.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isDemo) {
      setSong(DEMO_SONG);
      setScore({ notes: SCORE.notes, totalBeats: SCORE.totalBeats, fromDb: false });
      setSongLoading(false);
      return;
    }

    if (hasRoomSession && bandRoom.loading) {
      return;
    }

    if (!resolvedSongId) {
      setSongLoading(false);
      router.replace('/dashboard');
      return;
    }

    let cancelled = false;
    setSongLoading(true);

    void (async () => {
      const fetched = await fetchSongById(resolvedSongId);
      if (cancelled) return;
      if (!fetched) {
        router.replace('/dashboard');
        return;
      }
      const skipInstrumentGate = hasRoomSession && bandRoom.isLive;
      if (!skipInstrumentGate && readInstrumentConfirmedFor() !== resolvedSongId) {
        router.replace(`/instrument?songId=${encodeURIComponent(resolvedSongId)}`);
        return;
      }
      if (skipInstrumentGate) {
        saveInstrumentConfirmedFor(resolvedSongId);
      }
      setSong(fetched);
      saveActiveSongId(fetched.id);
      const inst = readInstrument();
      const fetchedScore = await fetchSongScore(fetched.id, inst, fetched.bpm || 120);
      if (cancelled) return;
      setScore(fetchedScore);
      setSongLoading(false);
    })();

    return () => { cancelled = true; };
  }, [isDemo, resolvedSongId, router, hasRoomSession, bandRoom.loading, bandRoom.isLive]);

  useEffect(() => {
    if (isDemo || !resolvedSongId || songLoading) return;
    void fetchSongScore(resolvedSongId, instrument, song?.bpm || 120).then(setScore);
  }, [instrument, isDemo, resolvedSongId, songLoading, song?.bpm]);

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

  const yourWindows = useMemo(() => {
    if (useScoreTurns) {
      return windowsFromNotes(score.notes, { gapBeats: 2, padBeats: 0.25 });
    }
    if (useDemoTurns) {
      return fractionsToBeatWindows(DEMO_YOUR_PART_FRACTIONS, total);
    }
    return [];
  }, [useScoreTurns, score.notes, useDemoTurns, total]);
  const viewerWindows = useMemo(() => {
    if (!useDemoTurns) return [];
    if (!isBandView) return yourWindows;
    const fractions = DEMO_ENTRY_SCHEDULE_FRACTIONS[instrument] ?? [];
    return fractionsToBeatWindows(fractions, total);
  }, [useDemoTurns, isBandView, instrument, total, yourWindows]);
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

  useEffect(() => {
    if (!useRealAudio) beatRef.current = curBeat;
  }, [curBeat, useRealAudio]);

  useEffect(() => {
    if (!isDemo || songLoading) return;
    const id = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(id);
  }, [isDemo, songLoading]);

  useEffect(() => {
    if (useRealAudio) beatRef.current = audio.curBeat;
  }, [useRealAudio, audio.curBeat]);

  const prevSoloBeatRef = useRef(0);
  useEffect(() => {
    if (!soloPlaying || isBandView) return;
    const b = soloCurBeat;
    const prev = prevSoloBeatRef.current;
    const mid = (prev + b) / 2;
    if (partsRef.current.some((p) => mid >= p.startBeat && mid < p.endBeat) && b > prev) {
      yourBeatsRef.current += b - prev;
      setYourTime(yourBeatsRef.current * 60 / bpm);
    }
    prevSoloBeatRef.current = b;
  }, [soloPlaying, soloCurBeat, bpm, isBandView]);

  useEffect(() => {
    if (useRealAudio) return;
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
  }, [playing, bpm, total, isBandView, useLocalBandClock, useRealAudio]);

  const effectivePlaying = isBandView && !useLocalBandClock
    ? bandRoom.room?.status === 'playing'
    : soloPlaying;

  const effectiveCurBeat = isBandView && !useLocalBandClock
    ? bandSync.curBeat
    : soloCurBeat;

  const syncReady = !isBandView || useLocalBandClock || bandSync.synced;

  const inst = instrument;
  const instName = t(`inst.${inst}`);
  const ownStemMuted = (vols[inst] ?? 0) <= 0;
  const setVol = (k: string, v: number) => setVols((p) => ({ ...p, [k]: v }));
  const curTime = effectiveCurBeat * 60 / bpm;
  const totalTime = total * 60 / bpm;
  const ratio = effectiveCurBeat / total;
  const rate = (bpm / 60) * tempo;

  const { status, curPart, nextPart } = viewerPartStatus(effectiveCurBeat, partWindows, LEAD_BEATS_DEFAULT);

  const secsToEntry = nextPart ? (nextPart.startBeat - effectiveCurBeat) / rate : null;
  const isWaiting = useTurnUI && status !== 'live';
  const showReadyCue = effectivePlaying && status === 'ready' && secsToEntry != null && secsToEntry <= 4.4;
  const cueNum = showReadyCue ? Math.max(1, Math.ceil(secsToEntry)) : null;
  const justEntered = effectivePlaying && curPart && (effectiveCurBeat - curPart.startBeat) < 0.9;

  const activeKeys = useMemo(() => {
    if (!effectivePlaying || !syncReady) return [];
    const beat = isBandView ? effectiveCurBeat : soloCurBeat;
    if (useScoreTurns) {
      return isYourTurnAt(beat, yourWindows) ? [inst] : [];
    }
    if (isBandView) {
      return activeInstrumentsAt(beat, total, DEMO_ENTRY_SCHEDULE_FRACTIONS, displayInstruments);
    }
    return activeInstrumentsAt(beat, total, DEMO_ENTRY_SCHEDULE_FRACTIONS, displayInstruments, {
      yourInstrument: inst,
      yourPartFractions: DEMO_YOUR_PART_FRACTIONS,
    });
  }, [
    effectivePlaying,
    syncReady,
    useScoreTurns,
    isBandView,
    effectiveCurBeat,
    soloCurBeat,
    yourWindows,
    inst,
    total,
    displayInstruments,
  ]);

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

  useEffect(() => {
    if (!liveViewerMember) return;
    setInstrument(liveViewerMember.instrument);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cordeband_instrument', liveViewerMember.instrument);
    }
  }, [liveViewerMember?.id, liveViewerMember?.instrument]);

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
    if (useRealAudio) {
      audio.seek(b);
      beatRef.current = b;
      return;
    }
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
    const loopBeat = isBandView ? effectiveCurBeat : soloCurBeat;
    if (loop) { setLoop(null); setPendingA(null); return; }
    if (pendingA === null) { setPendingA(loopBeat); return; }
    const a = Math.min(pendingA, loopBeat);
    const b = Math.max(pendingA, loopBeat);
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

    if (useRealAudio) {
      if (!audio.audioReady && audio.audioError) {
        setToast(audio.audioError);
        setTimeout(() => setToast(null), 3200);
        return;
      }
      await audio.toggle();
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

  const instrumentHref = resolvedSongId
    ? `/instrument?songId=${encodeURIComponent(resolvedSongId)}`
    : '/instrument';

  async function reprocessSong() {
    if (!resolvedSongId || isDemo || reprocessing) return;
    setReprocessing(true);
    try {
      const res = await fetch(`/api/songs/${resolvedSongId}/reprocess`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Reprocess failed');

      while (true) {
        await new Promise((r) => setTimeout(r, 1500));
        const jobRes = await fetch(`/api/songs/${resolvedSongId}/job`);
        if (!jobRes.ok) continue;
        const jobData = await jobRes.json();
        if (jobData.job?.status === 'failed') {
          throw new Error(jobData.job.error_message ?? 'Processing failed');
        }
        if (jobData.job?.status === 'completed' || jobData.songStatus === 'ready') {
          const refreshed = await fetchSongById(resolvedSongId);
          if (refreshed) setSong(refreshed);
          const inst = readInstrument();
          const fetchedScore = await fetchSongScore(resolvedSongId, inst, refreshed?.bpm || bpm);
          setScore(fetchedScore);
          setToast(t('up.p4t'));
          break;
        }
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : t('up.errB'));
    } finally {
      setReprocessing(false);
    }
  }

  const renderScorePanel = (
    curBeatVal: number,
    curTimeSecVal: number,
    playingVal: boolean,
    waitingVal: boolean,
  ) => {
    if (inst === 'vocals') {
      return (
        <LyricsViewer
          windows={yourWindows}
          curBeat={curBeatVal}
          bpm={bpm}
          playing={playingVal}
          waiting={waitingVal && !displayLoading && playingVal}
          waitLabel={t('player.waitOverlay')}
          loading={displayLoading}
          fromTranscription={useScoreTurns}
        />
      );
    }

    const sheetNotes = isDemo ? SCORE.notes : score.notes;
    const sheetTotalBeats = isDemo
      ? SCORE.totalBeats
      : (score.fromDb ? score.totalBeats : total);
    const sheetProps = {
      view,
      curBeat: curBeatVal,
      curTimeSec: curTimeSecVal,
      bpm,
      loop,
      loading: displayLoading,
      waiting: waitingVal && !displayLoading && playingVal,
      waitLabel: t('player.waitOverlay'),
      notes: sheetNotes,
      totalBeats: sheetTotalBeats,
      emptyMessage: !isDemo && inst === 'drums'
        ? t('player.scoreUnavailable')
        : !isDemo && !score.fromDb
          ? t('player.scoreEmpty')
          : undefined,
    };

    if (useAlphaTab && alphaTex && view !== 'roll') {
      return (
        <>
          <AlphaTabViewer
            alphaTex={alphaTex}
            curBeat={curBeatVal}
            loading={sheetProps.loading}
            waiting={sheetProps.waiting}
            waitLabel={sheetProps.waitLabel}
            fallback={<SheetViewer {...sheetProps} />}
          />
          {score.fromDb && (
            <p className="muted" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              {t('player.scoreApprox')}
            </p>
          )}
        </>
      );
    }

    return <SheetViewer {...sheetProps} />;
  };

  const restartPlayback = () => {
    if (useRealAudio) {
      audio.seek(0);
    } else {
      beatRef.current = 0;
      setCurBeat(0);
    }
    yourBeatsRef.current = 0;
    setYourTime(0);
    prevSoloBeatRef.current = 0;
  };

  if (songLoading || (!isDemo && !song)) {
    return (
      <div className="loader-center" style={{ minHeight: '60vh' }}>
        <ClassicLoader />
      </div>
    );
  }

  return (
    <main className="wrap app-main page">
      <div className="player-top">
        <div className="player-top-row">
          <Link href={instrumentHref} className="btn btn-ghost btn-sm">
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
                    {ownStemMuted && (
                      <span className="muted-tag"><span className="dot" />{instName} {t('player.muted')}</span>
                    )}
                    {ownStemMuted && <span style={{ opacity: 0.4 }}>·</span>}
                    <span>{S.bpm} BPM · {S.keySig}</span>
                  </div>
                </div>
                <div className="viewtoggle">
                  {([['staff', t('player.staff')], ['tab', t('player.tab')], ['roll', t('player.roll')]] as const).map(([k, l]) => (
                    <button key={k} type="button" className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>
                  ))}
                </div>
              </div>

              <BandTimeline
                lanes={timelineLanes}
                totalBeats={total}
                curBeat={effectiveCurBeat}
                youInstrument={inst}
              />

              {renderScorePanel(effectiveCurBeat, effectiveCurBeat * 60 / bpm, effectivePlaying, isWaiting)}

              <div className="card transport">
                <div className="transport-row">
                  <button
                    type="button"
                    className="play-btn"
                    disabled={displayLoading || (liveBandSession && bandRoom.isLive && !bandRoom.isLeader)}
                    onClick={togglePlaying}
                    title={liveBandSession && bandRoom.isLive && !bandRoom.isLeader ? t('room.waitingLeader') : undefined}
                  >
                    {effectivePlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                  </button>
                  <span className="time">{fmtTime(curTime)}</span>
                  <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                    <div className="scrub-track">
                      {useDemoTurns && viewerWindows.map((p, i) => (
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
                  <button type="button" className="chip-btn" onClick={restartPlayback}>
                    <IconReset size={14} /> {t('player.restart')}
                  </button>
                  <div className="grow" />
                  <button type="button" className="btn btn-primary btn-sm" onClick={downloadMp3}>
                    <IconUpload size={14} style={{ transform: 'rotate(180deg)' }} /> {t('player.download')}
                  </button>
                </div>
              </div>

              <PlayerBottom
                displayInstruments={displayInstruments}
                inst={inst}
                activeKeys={activeKeys}
                memberLabels={memberLabels}
                stageTitle={t('bandDemo.stageTitle')}
                stageSub={t('bandDemo.stageSub')}
                detectionMode={detectionMode}
                vols={vols}
                setVol={setVol}
                scoreFromDb={isDemo || score.fromDb}
                reprocessing={reprocessing}
                onReprocess={!isDemo ? reprocessSong : undefined}
              />
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
                  {ownStemMuted && (
                    <span className="muted-tag"><span className="dot" />{instName} {t('player.muted')}</span>
                  )}
                  {ownStemMuted && <span style={{ opacity: 0.4 }}>·</span>}
                  <span>{S.bpm} BPM · {S.keySig}</span>
                </div>
              </div>
              <div className="viewtoggle">
                {inst === 'vocals' ? (
                  <button type="button" className="on">{t('player.lyricsView')}</button>
                ) : (
                  ([['staff', t('player.staff')], ['tab', t('player.tab')], ['roll', t('player.roll')]] as const).map(([k, l]) => (
                    <button key={k} type="button" className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>
                  ))
                )}
              </div>
            </div>

            <div className="player-score-meta">
              <ScoreSourceBadge
                fromDb={score.fromDb}
                isDemo={isDemo}
                instrument={inst}
                noteCount={inst === 'vocals' ? yourWindows.length : score.notes.length}
                notes={score.notes}
              />
              {!soloPlaying && (score.notes.length > 0 || yourWindows.length > 0) && (
                <span className="player-play-hint muted">{t('player.playToAnimate')}</span>
              )}
            </div>

            {isDemo && (
              <div className="card" style={{ marginBottom: 12, borderColor: 'var(--line-2)' }}>
                <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>{t('player.demoNoAudio')}</p>
              </div>
            )}

            {useTurnUI && (
              <TurnBanner status={status} secsToEntry={secsToEntry} yourTime={yourTime} />
            )}

            {useRealAudio && audio.audioError && (
              <div className="card" style={{ marginBottom: 12, borderColor: 'var(--warn, #e8a838)' }}>
                <p style={{ margin: 0, fontSize: 13.5 }}>{audio.audioError}</p>
                {audio.audioError.toLowerCase().includes('expired') && (
                  <Link href="/upload" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
                    {t('dash.reactivate')}
                  </Link>
                )}
              </div>
            )}

            {useTurnUI && (
              <SoloPracticeTimeline
                instrument={inst}
                windows={yourWindows}
                totalBeats={total}
                curBeat={soloCurBeat}
                fromTranscription={useScoreTurns}
              />
            )}

            {renderScorePanel(soloCurBeat, soloCurTimeSec, soloPlaying, isWaiting)}

            <div className="card transport">
              <div className="transport-row">
                <button type="button" className="play-btn" disabled={displayLoading || (useRealAudio && !audio.audioReady && !audio.audioError)}
                  onClick={togglePlaying}>
                  {soloPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
                </button>
                <span className="time">{fmtTime(curTime)}</span>
                <div className="scrub" ref={scrubRef} onPointerDown={onScrubDown}>
                  <div className="scrub-track">
                    {useTurnUI && yourWindows.map((p, i) => (
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
                <button type="button" className="chip-btn" onClick={restartPlayback}>
                  <IconReset size={14} /> {t('player.restart')}
                </button>
                <div className="grow" />
                <button type="button" className="btn btn-primary btn-sm" onClick={downloadMp3}>
                  <IconUpload size={14} style={{ transform: 'rotate(180deg)' }} /> {t('player.download')}
                </button>
              </div>
            </div>

            <PlayerBottom
              displayInstruments={displayInstruments}
              inst={inst}
              activeKeys={activeKeys}
              stageTitle={t('sel.stageTitle')}
              stageSub={t('sel.stageSub')}
              detectionMode={detectionMode}
              vols={vols}
              setVol={setVol}
              scoreFromDb={isDemo || score.fromDb}
              reprocessing={reprocessing}
              onReprocess={!isDemo ? reprocessSong : undefined}
            />
          </section>

          {!affCollapsed && (
            <AffiliateRail
              instrument={inst}
              collapsed={false}
              onToggle={toggleAff}
              onClick={showToast}
              localBusinesses={localBusinesses}
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
          localBusinesses={localBusinesses}
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
