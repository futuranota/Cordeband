import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInstrumentDetectionMode } from '@/lib/instrument-detection';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { error } = await requireAdmin(request);
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
    .select('status, instruments')
    .eq('id', songId)
    .single();

  return NextResponse.json({
    job,
    songStatus: song?.status ?? null,
    instruments: song?.instruments ?? [],
    detectionMode: getInstrumentDetectionMode(),
  });
}
