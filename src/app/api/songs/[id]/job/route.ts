import { NextResponse } from 'next/server';
import { getInstrumentDetectionMode } from '@/lib/instrument-detection';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: songId } = await params;

  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, status, user_id, instruments')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (song.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: job, error: jobErr } = await supabase
    .from('processing_jobs')
    .select('id, song_id, status, progress_pct, error_message, started_at, completed_at, created_at')
    .eq('song_id', songId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  return NextResponse.json({
    job,
    songStatus: song.status,
    instruments: song.instruments ?? [],
    detectionMode: getInstrumentDetectionMode(),
  });
}
