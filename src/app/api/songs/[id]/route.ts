import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { removeUserStorageFiles } from '@/lib/supabase/user-song-storage';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: songId } = await params;

  const { data: song, error: fetchErr } = await supabase
    .from('songs')
    .select('id, user_id, storage_path, is_featured, source_type')
    .eq('id', songId)
    .single();

  if (fetchErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (song.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (song.is_featured) {
    return NextResponse.json({ error: 'Featured catalog songs cannot be deleted here' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: stems } = await admin
    .from('stems')
    .select('storage_path')
    .eq('song_id', songId);

  const storagePaths = new Set<string>();
  if (song.storage_path) storagePaths.add(song.storage_path);
  for (const stem of stems ?? []) {
    if (stem.storage_path) storagePaths.add(stem.storage_path);
  }

  const { error: deleteErr } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  try {
    await removeUserStorageFiles([...storagePaths]);
  } catch {
    /* storage cleanup best-effort */
  }

  return NextResponse.json({ ok: true });
}
