import { NextResponse } from 'next/server';
import { lookupBandRoomByToken } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? searchParams.get('code');

  if (!token?.trim()) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  try {
    const result = await lookupBandRoomByToken(token);
    if (!result) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const takenInstruments = result.members.map((m) => m.instrument);

    return NextResponse.json({
      room: {
        id: result.room.id,
        code: result.room.code,
        status: result.room.status,
        songId: result.room.song_id,
      },
      takenInstruments,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
