import { createClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/band-room';
import { getProfile, normalizePlan } from '@/lib/supabase/profile';
import type { BandMemberRecord, BandRoomRecord } from '@/types/band';
import type { InstrumentKey } from '@/lib/data';

const INST_KEYS = new Set<InstrumentKey>([
  'guitar', 'piano', 'bass', 'drums', 'vocals', 'other',
]);

async function fetchMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
): Promise<BandMemberRecord[]> {
  const { data, error } = await supabase
    .from('band_members')
    .select('*, profiles(full_name)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as BandMemberRecord[];
}

export async function ensureBandRoomSession(opts: {
  userId: string;
  instrument: InstrumentKey;
  songId?: string | null;
  roomId?: string | null;
  code?: string | null;
  guestName?: string | null;
}): Promise<{ room: BandRoomRecord; members: BandMemberRecord[] }> {
  if (opts.roomId || opts.code) {
    return joinBandRoom({
      userId: opts.userId,
      instrument: opts.instrument,
      roomId: opts.roomId ?? null,
      code: opts.code ?? null,
      guestName: opts.guestName ?? null,
    });
  }

  const supabase = await createClient();
  const profile = await getProfile(supabase, opts.userId);
  if (normalizePlan(profile?.plan) !== 'banda') {
    throw new Error('Band plan required to create a room');
  }

  const { data: existing } = await supabase
    .from('band_rooms')
    .select('*')
    .eq('host_id', opts.userId)
    .neq('status', 'ended')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let room = existing as BandRoomRecord | null;

  if (!room) {
    let code = generateRoomCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('band_rooms')
        .insert({
          code,
          host_id: opts.userId,
          song_id: opts.songId ?? null,
          status: 'waiting',
        })
        .select('*')
        .single();

      if (!error && data) {
        room = data as BandRoomRecord;
        break;
      }
      code = generateRoomCode();
    }
    if (!room) throw new Error('Could not create band room');
  }

  const { data: memberRow, error: memberErr } = await supabase
    .from('band_members')
    .upsert(
      {
        room_id: room.id,
        user_id: opts.userId,
        instrument: opts.instrument,
        is_leader: room.host_id === opts.userId,
        status: 'joined',
        guest_name: null,
      },
      { onConflict: 'room_id,user_id' },
    )
    .select('*')
    .single();

  if (memberErr) throw memberErr;

  void memberRow;

  const members = await fetchMembers(supabase, room.id);
  return { room, members };
}

async function joinBandRoom(opts: {
  userId: string;
  instrument: InstrumentKey;
  roomId: string | null;
  code: string | null;
  guestName?: string | null;
}): Promise<{ room: BandRoomRecord; members: BandMemberRecord[] }> {
  const supabase = await createClient();

  let query = supabase.from('band_rooms').select('*');
  if (opts.roomId) {
    query = query.eq('id', opts.roomId);
  } else if (opts.code) {
    query = query.eq('code', opts.code.toUpperCase());
  } else {
    throw new Error('roomId or code required');
  }

  const { data: room, error: roomErr } = await query.single();
  if (roomErr || !room) throw roomErr ?? new Error('Room not found');
  if (room.status === 'ended') throw new Error('Room has ended');

  const profile = await getProfile(supabase, opts.userId);
  const displayName = opts.guestName?.trim()
    || profile?.full_name?.trim()
    || null;

  const isHost = room.host_id === opts.userId;
  const { error: memberErr } = await supabase.from('band_members').upsert(
    {
      room_id: room.id,
      user_id: opts.userId,
      instrument: opts.instrument,
      is_leader: isHost,
      status: 'joined',
      guest_name: displayName,
    },
    { onConflict: 'room_id,user_id' },
  );

  if (memberErr) {
    if (memberErr.code === '23505') {
      throw new Error('Instrument already taken in this room');
    }
    throw memberErr;
  }

  const members = await fetchMembers(supabase, room.id);
  return { room: room as BandRoomRecord, members };
}

export async function endBandRoom(opts: {
  roomId: string;
  hostId: string;
}): Promise<BandRoomRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('band_rooms')
    .update({ status: 'ended', play_started_at: null })
    .eq('id', opts.roomId)
    .eq('host_id', opts.hostId)
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Room not found');
  return data as BandRoomRecord;
}

export function parseInstrument(value: unknown): InstrumentKey | null {
  if (typeof value === 'string' && INST_KEYS.has(value as InstrumentKey)) {
    return value as InstrumentKey;
  }
  return null;
}

export async function setRoomPlayState(opts: {
  roomId: string;
  hostId: string;
  action: 'play' | 'pause';
}): Promise<BandRoomRecord> {
  const supabase = await createClient();

  const patch =
    opts.action === 'play'
      ? { status: 'playing' as const, play_started_at: new Date().toISOString() }
      : { status: 'waiting' as const, play_started_at: null };

  const { data, error } = await supabase
    .from('band_rooms')
    .update(patch)
    .eq('id', opts.roomId)
    .eq('host_id', opts.hostId)
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('Room not found');
  return data as BandRoomRecord;
}
