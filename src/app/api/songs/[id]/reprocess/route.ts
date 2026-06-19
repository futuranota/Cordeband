import { NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/admin-auth';
import { dispatchSongProcessing } from '@/lib/audio-processor';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: songId } = await params;

  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, user_id, storage_path, status')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (song.user_id !== user.id && !isAdminUser(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!song.storage_path) {
    return NextResponse.json({ error: 'Original audio missing — upload the song again' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .insert({ song_id: songId, status: 'queued', progress_pct: 0 })
    .select('id, song_id, status, progress_pct, error_message')
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? 'Job create failed' }, { status: 500 });
  }

  await admin.from('songs').update({ status: 'processing' }).eq('id', songId);

  try {
    await dispatchSongProcessing(songId, song.storage_path, job.id);
  } catch (dispatchErr) {
    const message = dispatchErr instanceof Error ? dispatchErr.message : 'Processor dispatch failed';
    await admin.from('processing_jobs').update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);
    await admin.from('songs').update({ status: 'failed' }).eq('id', songId);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ job });
}
