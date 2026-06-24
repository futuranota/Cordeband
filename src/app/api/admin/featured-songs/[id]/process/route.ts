import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runMockFeaturedProcessor } from '@/lib/mock-audio-processor';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id: songId } = await params;
  const admin = createAdminClient();

  const { data: song, error: songErr } = await admin
    .from('songs')
    .select('id, is_featured')
    .eq('id', songId)
    .eq('is_featured', true)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .insert({ song_id: songId, status: 'queued', progress_pct: 0 })
    .select('id, song_id, status, progress_pct, error_message')
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? 'Job create failed' }, { status: 500 });
  }

  await admin.from('songs').update({ status: 'processing' }).eq('id', songId);

  void runMockFeaturedProcessor(songId, job.id).catch(() => {
    /* errors persisted on job row */
  });

  return NextResponse.json({ job });
}
