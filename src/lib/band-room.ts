import type { InstrumentKey } from '@/lib/data';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';
import type { BandMember } from '@/lib/demo-band';
import type { BandMemberRow } from '@/lib/band-turn-overlay';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `BND-${suffix}`;
}

export function memberDisplayName(m: BandMemberRecord): string {
  const fromProfile = m.profiles?.full_name?.trim();
  if (fromProfile) return fromProfile;
  if (m.guest_name?.trim()) return m.guest_name.trim();
  return 'Músico';
}

export function toBandMemberRow(
  m: BandMemberRecord,
  hostId: string,
): BandMemberRow {
  return {
    id: m.id,
    name: memberDisplayName(m),
    instrument: m.instrument,
    isLeader: m.is_leader || m.user_id === hostId,
  };
}

export function toUiBandMember(
  m: BandMemberRecord,
  hostId: string,
  activeInstruments: InstrumentKey[],
  sessionPlaying: boolean,
): BandMember {
  const active = m.status !== 'disconnected';
  return {
    id: m.id,
    name: memberDisplayName(m),
    instrument: m.instrument,
    active,
    playing: sessionPlaying && active && activeInstruments.includes(m.instrument),
    isLeader: m.is_leader || m.user_id === hostId,
  };
}

export function leaderNameFromMembers(
  members: BandMemberRecord[],
  hostId: string,
): string {
  const leader = members.find((m) => m.is_leader || m.user_id === hostId);
  return leader ? memberDisplayName(leader) : 'Líder';
}

export function viewerMember(
  members: BandMemberRecord[],
  userId: string | null,
): BandMemberRecord | null {
  if (!userId) return null;
  return members.find((m) => m.user_id === userId) ?? null;
}

export function isRoomHost(room: BandRoomRecord, userId: string | null): boolean {
  return !!userId && room.host_id === userId;
}

export function bandJoinPath(code: string): string {
  return `/join/${encodeURIComponent(code)}`;
}

export function bandJoinUrl(code: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${bandJoinPath(code)}`;
}
