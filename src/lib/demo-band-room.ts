import { DEMO_BAND_MEMBERS } from '@/lib/demo-band';
import type { BandMemberRow, BandRoomStatus } from '@/lib/band-turn-overlay';
import type { InstrumentKey } from '@/lib/data';

export const DEMO_BAND_ROOM_ID = 'demo-room';

export function demoBandLeaderName(): string {
  return DEMO_BAND_MEMBERS.find((m) => m.isLeader)?.name ?? 'Tú';
}

export function demoBandMembersAsRows(): BandMemberRow[] {
  return DEMO_BAND_MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    instrument: m.instrument,
    isLeader: m.isLeader,
  }));
}

export function buildDemoBandRoom(opts: {
  playing: boolean;
  playStartedAt?: string | null;
}): {
  id: string;
  status: BandRoomStatus;
  leaderName: string;
  leaderUserId: string;
  playStartedAt: string | null;
} {
  return {
    id: DEMO_BAND_ROOM_ID,
    status: opts.playing ? 'playing' : 'waiting',
    leaderName: demoBandLeaderName(),
    leaderUserId: 'leader',
    playStartedAt: opts.playStartedAt ?? null,
  };
}

export function buildDemoBandViewer(opts: {
  name: string;
  instrument: InstrumentKey;
  isLeader?: boolean;
}): {
  memberId: string;
  name: string;
  instrument: InstrumentKey;
  isLeader: boolean;
} {
  const member = DEMO_BAND_MEMBERS.find((m) => m.instrument === opts.instrument);
  return {
    memberId: member?.id ?? 'viewer',
    name: opts.name,
    instrument: opts.instrument,
    isLeader: opts.isLeader ?? member?.isLeader ?? false,
  };
}
