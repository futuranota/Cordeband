import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { endBandRoom } from '@/lib/supabase/band-room-server';

type RouteContext = { params: Promise<{ roomId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (body.action !== 'end') {
    return NextResponse.json({ error: 'action must be end' }, { status: 400 });
  }

  try {
    const room = await endBandRoom({ roomId, hostId: user.id });
    return NextResponse.json({ room });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'End session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
