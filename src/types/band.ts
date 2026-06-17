import type { InstrumentKey } from '@/lib/data';
import type { BandRoomStatus } from '@/lib/band-turn-overlay';

export type BandRoomRecord = {
  id: string;
  code: string;
  host_id: string;
  song_id: string | null;
  status: BandRoomStatus;
  play_started_at: string | null;
  tempo: number;
  created_at: string;
  expires_at: string | null;
};

export type BandMemberRecord = {
  id: string;
  room_id: string;
  user_id: string | null;
  guest_name: string | null;
  instrument: InstrumentKey;
  is_leader: boolean;
  status: 'joined' | 'ready' | 'disconnected';
  joined_at: string;
  profiles?: { full_name: string | null } | null;
};

export type BandRoomSession = {
  room: BandRoomRecord;
  members: BandMemberRecord[];
};
