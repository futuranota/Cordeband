import { NextResponse } from 'next/server';
import { dispatchSongProcessing } from '@/lib/audio-processor';
import { includedSongQuota } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { getProfile, normalizePlan } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/server';
import {
  MAX_UPLOAD_BYTES,
  uploadUserOriginal,
  userOriginalPath,
} from '@/lib/supabase/user-song-storage';
import {
  mapUserSongRowToSong,
  USER_SONG_SELECT,
  type UserSongRow,
} from '@/lib/supabase/user-songs';

const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];

function pickGlyph(title: string): string {
  const glyphs = ['♪', '♫', '♬', '♩'];
  return glyphs[title.charCodeAt(0) % glyphs.length];
}

function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Sin título';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('songs')
    .select(USER_SONG_SELECT)
    .eq('user_id', user.id)
    .eq('source_type', 'upload')
    .neq('status', 'failed')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const songs = (data as UserSongRow[]).map((row) => mapUserSongRowToSong(row));
  return NextResponse.json({ songs });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audio = form.get('audio');
  const titleRaw = String(form.get('title') ?? '').trim();
  const artist = String(form.get('artist') ?? '').trim();

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  }
  if (audio.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 400 });
  }
  if (audio.type && !AUDIO_TYPES.includes(audio.type) && !audio.name.match(/\.(mp3|wav|flac)$/i)) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
  }

  const profile = await getProfile(supabase, user.id);
  const plan = normalizePlan(profile?.plan);
  const limit = includedSongQuota(plan);

  const { count, error: countErr } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('source_type', 'upload')
    .neq('status', 'failed');

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: 'Song limit reached for your plan' }, { status: 403 });
  }

  const title = titleRaw || titleFromFileName(audio.name);
  const admin = createAdminClient();

  const { data: song, error: insertErr } = await admin
    .from('songs')
    .insert({
      user_id: user.id,
      title,
      artist,
      glyph: pickGlyph(title),
      source_type: 'upload',
      status: 'pending',
      is_featured: false,
      is_public: false,
      stems_expires_at: null,
      added_this_month: false,
    })
    .select(USER_SONG_SELECT)
    .single();

  if (insertErr || !song) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  const songId = song.id as string;
  const storagePath = userOriginalPath(songId, audio.name);

  try {
    await uploadUserOriginal(storagePath, audio, audio.type || 'audio/mpeg');
    await admin.from('songs').update({
      storage_path: storagePath,
      status: 'processing',
    }).eq('id', songId);
  } catch (uploadErr) {
    await admin.from('songs').delete().eq('id', songId);
    const message = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: job, error: jobErr } = await admin
    .from('processing_jobs')
    .insert({ song_id: songId, status: 'queued', progress_pct: 0 })
    .select('id, song_id, status, progress_pct, error_message')
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? 'Job create failed' }, { status: 500 });
  }

  try {
    await dispatchSongProcessing(songId, storagePath, job.id);
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

  const { data: refreshed } = await admin
    .from('songs')
    .select(USER_SONG_SELECT)
    .eq('id', songId)
    .single();

  return NextResponse.json({
    song: mapUserSongRowToSong(refreshed as UserSongRow),
    job,
  });
}
