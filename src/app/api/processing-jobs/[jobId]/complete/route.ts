import { NextResponse } from 'next/server';
import { authorizeProcessorCallback } from '@/lib/processor-callback-auth';
import { convertAndStoreMidiNotes } from '@/lib/songs/user-midi-upload';
import { createAdminClient } from '@/lib/supabase/admin';
import { downloadPendingMidi } from '@/lib/supabase/user-song-storage';
import type { InstrumentKey } from '@/lib/data';

type Params = { params: Promise<{ jobId: string }> };

type CallbackBody = {
  song_id?: string;
  status?: 'completed' | 'failed';
  error?: string;
};

export async function POST(request: Request, { params }: Params) {
  if (!authorizeProcessorCallback(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;
  let body: CallbackBody;
  try {
    body = (await request.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .select('id, song_id')
    .eq('id', jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (body.status === 'failed') {
    await admin
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: body.error ?? 'Processor reported failure',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    await admin.from('songs').update({ status: 'failed' }).eq('id', job.song_id);
    return NextResponse.json({ ok: true });
  }

  const { data: song } = await admin
    .from('songs')
    .select('id, bpm, pending_midi_path, pending_midi_instrument')
    .eq('id', job.song_id)
    .single();

  if (!song?.pending_midi_path || !song.pending_midi_instrument) {
    return NextResponse.json({ ok: true, converted: false });
  }

  const bpm = Number(song.bpm) > 0 ? Number(song.bpm) : 120;

  try {
    const buffer = await downloadPendingMidi(song.pending_midi_path);
    await convertAndStoreMidiNotes(
      admin,
      song.id,
      song.pending_midi_instrument as InstrumentKey,
      buffer,
      bpm,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MIDI conversion failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await admin
      .from('songs')
      .update({ pending_midi_path: null, pending_midi_instrument: null })
      .eq('id', song.id);
  }

  return NextResponse.json({ ok: true, converted: true });
}
