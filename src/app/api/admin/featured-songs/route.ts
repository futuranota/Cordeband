import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_CATALOG_SELECT, mapCatalogRowToSong } from '@/lib/supabase/catalog-songs';
import { extFromName, uploadFeaturedFile } from '@/lib/supabase/featured-storage';
import { runMockFeaturedProcessor } from '@/lib/mock-audio-processor';
import type { CatalogSongRow } from '@/types/catalog';

const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function pickGlyph(title: string): string {
  const glyphs = ['♪', '♫', '♬', '♩'];
  return glyphs[title.charCodeAt(0) % glyphs.length];
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from('songs')
    .select(ADMIN_CATALOG_SELECT)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const songs = (data as CatalogSongRow[]).map(mapCatalogRowToSong);
  return NextResponse.json({ songs });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const title = String(form.get('title') ?? '').trim();
  const artist = String(form.get('artist') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const isAiGenerated = form.get('isAiGenerated') === 'true';
  const audio = form.get('audio');
  const cover = form.get('cover');

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  }
  if (audio.type && !AUDIO_TYPES.includes(audio.type) && !audio.name.match(/\.(mp3|wav|flac)$/i)) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
  }
  if (cover instanceof File && cover.size > 0 && cover.type && !IMAGE_TYPES.includes(cover.type)) {
    return NextResponse.json({ error: 'Unsupported cover image' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: song, error: insertErr } = await admin
    .from('songs')
    .insert({
      title,
      artist,
      description: description || null,
      glyph: pickGlyph(title),
      is_ai_generated: isAiGenerated,
      source_type: 'catalog',
      status: 'processing',
      is_featured: true,
      is_public: false,
      user_id: null,
      stems_expires_at: null,
    })
    .select(ADMIN_CATALOG_SELECT)
    .single();

  if (insertErr || !song) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  const songId = song.id as string;
  const audioExt = extFromName(audio.name, 'mp3');
  const audioPath = `audio/${songId}.${audioExt}`;

  try {
    const audioUrl = await uploadFeaturedFile(audioPath, audio, audio.type || 'audio/mpeg');

    let coverUrl: string | null = null;
    let coverPath: string | null = null;
    if (cover instanceof File && cover.size > 0) {
      const coverExt = extFromName(cover.name, 'jpg');
      coverPath = `covers/${songId}.${coverExt}`;
      coverUrl = await uploadFeaturedFile(coverPath, cover, cover.type || 'image/jpeg');
    }

    await admin.from('songs').update({
      storage_path: audioPath,
      featured_storage_url: audioUrl,
      cover_url: coverUrl,
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

  void runMockFeaturedProcessor(songId, job.id).catch(() => {
    /* errors persisted on job row */
  });

  const { data: refreshed } = await admin
    .from('songs')
    .select(ADMIN_CATALOG_SELECT)
    .eq('id', songId)
    .single();

  return NextResponse.json({
    song: mapCatalogRowToSong(refreshed as CatalogSongRow),
    job,
  });
}
