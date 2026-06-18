import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id: songId } = await params;
  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .select('id, song_id, status, progress_pct, error_message, started_at, completed_at, created_at')
    .eq('song_id', songId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  const { data: song } = await admin
    .from('songs')
    .select('status')
    .eq('id', songId)
    .single();

  return NextResponse.json({ job, songStatus: song?.status ?? null });
}
