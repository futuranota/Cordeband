import type { InstrumentKey } from '@/lib/data';
import { fmtTime } from '@/lib/data';
import {
  activeInstrumentsAt,
  DEMO_ENTRY_SCHEDULE_FRACTIONS,
  fractionsToBeatWindows,
  LEAD_BEATS_DEFAULT,
  viewerPartStatus,
  type EntryScheduleFractions,
} from '@/lib/band-schedule';

export type BandRoomStatus = 'waiting' | 'playing' | 'ended';

export type BandMemberRow = {
  id: string;
  name: string;
  instrument: InstrumentKey;
  isLeader?: boolean;
};

export type BandTurnOverlayKind =
  | 'lobby'
  | 'pre_roll'
  | 'your_live'
  | 'your_ready'
  | 'your_waiting'
  | 'other_live'
  | 'rest'
  | 'ended'
  | 'unassigned';

export type BandTurnOverlayVariant = 'waiting' | 'ready' | 'live' | 'neutral' | 'ended';

export type BandTurnOverlayInput = {
  room: {
    status: BandRoomStatus;
    playStartedAt: string | null;
    leaderName: string;
  };
  members: readonly BandMemberRow[];
  viewer: {
    name: string;
    instrument: InstrumentKey | null;
  };
  playback: {
    playing: boolean;
    curBeat: number;
    totalBeats: number;
    bpm: number;
    tempo: number;
    yourTime?: number;
  };
  scheduleFractions?: EntryScheduleFractions;
  presentInstruments: readonly InstrumentKey[];
  leadBeats?: number;
  preRollSecs?: number;
  nowMs?: number;
};

export type BandTurnOverlayResolved = {
  kind: BandTurnOverlayKind;
  variant: BandTurnOverlayVariant;
  title: string;
  subtitle?: string;
  countdownSecs?: number;
  yourTime?: number;
  otherMember?: { name: string; instrument: InstrumentKey };
  highlightName?: string;
};

export type BandOverlayStrings = {
  lobbyTitle: string;
  preRoll: string;
  yourTurn: string;
  yourReady: string;
  yourWaiting: string;
  otherPlaying: string;
  rest: string;
  ended: string;
  watching: string;
  youSubLive: string;
  youSubReady: string;
  inst: (key: InstrumentKey) => string;
};

export function formatOverlayString(
  template: string,
  params: Record<string, string | number>,
): string {
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template,
  );
}

export function memberForInstrument(
  members: readonly BandMemberRow[],
  instrument: InstrumentKey,
): BandMemberRow | null {
  return members.find((m) => m.instrument === instrument) ?? null;
}

export function resolveBandTurnOverlay(
  input: BandTurnOverlayInput,
  strings: BandOverlayStrings,
): BandTurnOverlayResolved {
  const schedule = input.scheduleFractions ?? DEMO_ENTRY_SCHEDULE_FRACTIONS;
  const leadBeats = input.leadBeats ?? LEAD_BEATS_DEFAULT;
  const preRollSecs = input.preRollSecs ?? 3;
  const nowMs = input.nowMs ?? Date.now();
  const { room, members, viewer, playback } = input;
  const rate = (playback.bpm / 60) * playback.tempo;

  if (room.status === 'ended') {
    return { kind: 'ended', variant: 'ended', title: strings.ended };
  }

  if (room.status === 'waiting' || !playback.playing) {
    return {
      kind: 'lobby',
      variant: 'neutral',
      title: formatOverlayString(strings.lobbyTitle, { leader: room.leaderName }),
    };
  }

  if (room.playStartedAt) {
    const startMs = Date.parse(room.playStartedAt);
    const preRollEnd = startMs + preRollSecs * 1000;
    if (!Number.isNaN(startMs) && nowMs < preRollEnd) {
      const countdownSecs = Math.max(1, Math.ceil((preRollEnd - nowMs) / 1000));
      return {
        kind: 'pre_roll',
        variant: 'ready',
        title: formatOverlayString(strings.preRoll, { n: countdownSecs }),
        countdownSecs,
      };
    }
  }

  if (viewer.instrument == null) {
    return { kind: 'unassigned', variant: 'neutral', title: strings.watching };
  }

  const active = activeInstrumentsAt(
    playback.curBeat,
    playback.totalBeats,
    schedule,
    input.presentInstruments,
  );

  const myInstrument = viewer.instrument;

  if (active.includes(myInstrument)) {
    return {
      kind: 'your_live',
      variant: 'live',
      title: formatOverlayString(strings.yourTurn, { name: viewer.name }),
      subtitle: strings.youSubLive,
      yourTime: playback.yourTime,
      highlightName: viewer.name,
    };
  }

  const yourWindows = fractionsToBeatWindows(
    schedule[myInstrument] ?? [],
    playback.totalBeats,
  );
  const part = viewerPartStatus(playback.curBeat, yourWindows, leadBeats);

  if (part.status === 'ready' && part.nextPart) {
    const secs = Math.max(0, (part.nextPart.startBeat - playback.curBeat) / rate);
    return {
      kind: 'your_ready',
      variant: 'ready',
      title: formatOverlayString(strings.yourReady, {
        name: viewer.name,
        secs: Math.max(1, Math.ceil(secs)),
      }),
      subtitle: strings.youSubReady,
      countdownSecs: Math.max(1, Math.ceil(secs)),
      highlightName: viewer.name,
    };
  }

  const otherInstrument = active.find((k) => k !== myInstrument);
  if (otherInstrument) {
    const other = memberForInstrument(members, otherInstrument);
    const otherName = other?.name ?? strings.inst(otherInstrument);
    return {
      kind: 'other_live',
      variant: 'live',
      title: formatOverlayString(strings.otherPlaying, {
        name: otherName,
        inst: strings.inst(otherInstrument),
      }),
      otherMember: { name: otherName, instrument: otherInstrument },
      highlightName: otherName,
    };
  }

  if (part.status === 'waiting' && part.nextPart) {
    const secs = Math.max(0, (part.nextPart.startBeat - playback.curBeat) / rate);
    return {
      kind: 'your_waiting',
      variant: 'waiting',
      title: formatOverlayString(strings.yourWaiting, { time: fmtTime(secs) }),
    };
  }

  return { kind: 'rest', variant: 'neutral', title: strings.rest };
}
