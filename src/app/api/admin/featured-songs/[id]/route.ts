import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_CATALOG_SELECT, mapCatalogRowToSong } from '@/lib/supabase/catalog-songs';
import { removeFeaturedFiles } from '@/lib/supabase/featured-storage';
import type { CatalogSongRow } from '@/types/catalog';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from('songs')
    .select('id, status, is_featured, storage_path, cover_url')
    .eq('id', id)
    .eq('is_featured', true)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.artist === 'string') patch.artist = body.artist.trim();
  if (typeof body.description === 'string') patch.description = body.description.trim() || null;
  if (typeof body.isAiGenerated === 'boolean') patch.is_ai_generated = body.isAiGenerated;

  if (typeof body.isPublic === 'boolean') {
    if (body.isPublic && existing.status !== 'ready') {
      return NextResponse.json({ error: 'Song must be ready before publishing' }, { status: 400 });
    }
    patch.is_public = body.isPublic;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  const { data, error: updateErr } = await admin
    .from('songs')
    .update(patch)
    .eq('id', id)
    .select(ADMIN_CATALOG_SELECT)
    .single();

  if (updateErr || !data) {
    return NextResponse.json({ error: updateErr?.message ?? 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ song: mapCatalogRowToSong(data as CatalogSongRow) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: existing, error: fetchErr } = await admin
    .from('songs')
    .select('id, storage_path, cover_url')
    .eq('id', id)
    .eq('is_featured', true)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const paths: string[] = [];
  if (existing.storage_path) paths.push(existing.storage_path);
  if (existing.cover_url) {
    const marker = '/featured/';
    const idx = existing.cover_url.indexOf(marker);
    if (idx !== -1) paths.push(existing.cover_url.slice(idx + marker.length));
  }

  const { error: deleteErr } = await admin.from('songs').delete().eq('id', id);
  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  try {
    await removeFeaturedFiles(paths);
  } catch {
    /* storage cleanup best-effort */
  }

  return NextResponse.json({ ok: true });
}
