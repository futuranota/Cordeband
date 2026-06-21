'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  isRoomHost,
  leaderNameFromMembers,
  toBandMemberRow,
  viewerMember,
} from '@/lib/band-room';
import type { BandMemberRow } from '@/lib/band-turn-overlay';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';
import type { InstrumentKey } from '@/lib/data';

export type UseBandRoomOptions = {
  enabled: boolean;
  userId: string | null;
  instrument: InstrumentKey;
  songId?: string | null;
  roomId?: string | null;
  roomCode?: string | null;
};

export type UseBandRoomResult = {
  room: BandRoomRecord | null;
  members: BandMemberRecord[];
  memberRows: BandMemberRow[];
  leaderName: string;
  isLeader: boolean;
  isLive: boolean;
  useDemoFallback: boolean;
  loading: boolean;
  error: string | null;
  refreshInstrument: (instrument: InstrumentKey) => Promise<void>;
};

export function useBandRoom(opts: UseBandRoomOptions): UseBandRoomResult {
  const [room, setRoom] = useState<BandRoomRecord | null>(null);
  const [members, setMembers] = useState<BandMemberRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDemoFallback, setUseDemoFallback] = useState(false);
  const instrumentRef = useRef(opts.instrument);
  instrumentRef.current = opts.instrument;

  const loadSession = useCallback(async (instrument: InstrumentKey, forceInstrumentUpdate = false) => {
    const res = await fetch('/api/band-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instrument,
        songId: opts.songId ?? null,
        roomId: opts.roomId ?? null,
        code: opts.roomCode ?? null,
        forceInstrumentUpdate,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<{
      room: BandRoomRecord;
      members: BandMemberRecord[];
    }>;
  }, [opts.roomCode, opts.roomId, opts.songId]);

  const fetchMembersClient = useCallback(async (roomId: string) => {
    const supabase = createClient();
    const { data, error: fetchErr } = await supabase
      .from('band_members')
      .select('*, profiles(full_name)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (fetchErr) throw fetchErr;
    setMembers((data ?? []) as BandMemberRecord[]);
  }, []);

  useEffect(() => {
    if (!opts.enabled || !opts.userId) {
      setRoom(null);
      setMembers([]);
      setUseDemoFallback(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUseDemoFallback(false);

    loadSession(instrumentRef.current, false)
      .then((session) => {
        if (cancelled) return;
        setRoom(session.room);
        setMembers(session.members);
      })
      .catch((err) => {
        if (cancelled) return;
        setUseDemoFallback(true);
        setError(err instanceof Error ? err.message : 'Band room unavailable');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [opts.enabled, opts.userId, loadSession]);

  useEffect(() => {
    if (!opts.enabled || !room?.id || useDemoFallback) return;

    const supabase = createClient();
    const roomId = room.id;

    const channel = supabase
      .channel(`band_room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'band_members', filter: `room_id=eq.${roomId}` },
        () => { void fetchMembersClient(roomId); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'band_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          setRoom(payload.new as BandRoomRecord);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [opts.enabled, room?.id, useDemoFallback, fetchMembersClient]);

  const refreshInstrument = useCallback(async (instrument: InstrumentKey) => {
    if (!opts.enabled || !opts.userId) return;
    try {
      const session = await loadSession(instrument, true);
      setRoom(session.room);
      setMembers(session.members);
      setUseDemoFallback(false);
      setError(null);
    } catch (err) {
      setUseDemoFallback(true);
      setError(err instanceof Error ? err.message : 'Band room unavailable');
    }
  }, [opts.enabled, opts.userId, loadSession]);

  const isLive = !useDemoFallback && room != null;
  const hostId = room?.host_id ?? '';
  const leaderName = isLive ? leaderNameFromMembers(members, hostId) : 'Líder';
  const isLeader = isLive && isRoomHost(room!, opts.userId);
  const memberRows = isLive
    ? members.map((m) => toBandMemberRow(m, hostId))
    : [];

  return {
    room,
    members,
    memberRows,
    leaderName,
    isLeader,
    isLive,
    useDemoFallback,
    loading,
    error,
    refreshInstrument,
  };
}

export function useBandViewerMember(
  members: BandMemberRecord[],
  userId: string | null,
): BandMemberRecord | null {
  return viewerMember(members, userId);
}
