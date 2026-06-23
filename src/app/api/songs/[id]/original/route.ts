import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const SIGNED_URL_TTL_SEC = 3600;

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
    .select('id, storage_path, stems_expires_at')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (song.stems_expires_at) {
    const expires = new Date(song.stems_expires_at).getTime();
    if (!Number.isNaN(expires) && expires <= Date.now()) {
      return NextResponse.json({ error: 'Original expired — re-upload the song to reactivate' }, { status: 403 });
    }
  }

  if (!song.storage_path) {
    return NextResponse.json({ error: 'No original audio available for this song' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from('stems')
    .createSignedUrl(song.storage_path, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Signed URL failed' }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SEC * 1000).toISOString(),
  });
}
