import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createUserOriginalUploadUrl, MAX_UPLOAD_BYTES, userOriginalPath } from '@/lib/supabase/user-song-storage';

const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac'];

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: songId } = await params;
  const body = await request.json().catch(() => ({}));
  const fileName = typeof body.fileName === 'string' ? body.fileName : '';
  const fileSize = Number(body.fileSize) || 0;
  const contentType = typeof body.contentType === 'string' ? body.contentType : 'audio/mpeg';

  if (!fileName.trim() || fileSize <= 0) {
    return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
  }
  if (!AUDIO_TYPES.includes(contentType) && !fileName.match(/\.(mp3|wav|flac)$/i)) {
    return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 });
  }

  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, user_id, storage_path, is_featured')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (song.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (song.is_featured) {
    return NextResponse.json({ error: 'Featured catalog songs cannot be replaced' }, { status: 400 });
  }

  const storagePath = song.storage_path ?? userOriginalPath(songId, fileName);
  const admin = createAdminClient();

  try {
    const upload = await createUserOriginalUploadUrl(storagePath);

    if (!song.storage_path) {
      await admin.from('songs').update({ storage_path: storagePath }).eq('id', songId);
    }

    return NextResponse.json({
      upload: { ...upload, contentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signed upload URL failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
