import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureBandRoomSession, parseInstrument } from '@/lib/supabase/band-room-server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { instrument?: string; songId?: string | null; roomId?: string; code?: string; guestName?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const instrument = parseInstrument(body.instrument) ?? 'guitar';

  try {
    const session = await ensureBandRoomSession({
      userId: user.id,
      instrument,
      songId: body.songId ?? null,
      roomId: body.roomId ?? null,
      code: body.code ?? null,
      guestName: body.guestName ?? null,
    });
    return NextResponse.json(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Band room error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
