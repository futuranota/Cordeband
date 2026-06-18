import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { InstrumentKey } from '@/lib/data';

const SIGNED_URL_TTL_SEC = 3600;

const VALID_INSTRUMENTS: InstrumentKey[] = [
  'guitar', 'piano', 'bass', 'drums', 'vocals', 'other',
];

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
    .select('id, stems_expires_at, status')
    .eq('id', songId)
    .single();

  if (songErr || !song) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (song.stems_expires_at) {
    const expires = new Date(song.stems_expires_at).getTime();
    if (!Number.isNaN(expires) && expires <= Date.now()) {
      return NextResponse.json({ error: 'Stems expired — re-upload the song to reactivate' }, { status: 403 });
    }
  }

  const { data: stems, error: stemsErr } = await supabase
    .from('stems')
    .select('instrument_type, storage_path')
    .eq('song_id', songId);

  if (stemsErr) {
    return NextResponse.json({ error: stemsErr.message }, { status: 500 });
  }

  const admin = createAdminClient();
  const signed: {
    instrument: InstrumentKey;
    signedUrl: string;
    expiresAt: string;
  }[] = [];

  for (const stem of stems ?? []) {
    const instrument = stem.instrument_type as InstrumentKey;
    if (!VALID_INSTRUMENTS.includes(instrument) || !stem.storage_path) continue;

    const { data, error } = await admin.storage
      .from('stems')
      .createSignedUrl(stem.storage_path, SIGNED_URL_TTL_SEC);

    if (error || !data?.signedUrl) continue;

    signed.push({
      instrument,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SEC * 1000).toISOString(),
    });
  }

  if (!signed.length) {
    return NextResponse.json({ error: 'No stems available for this song' }, { status: 404 });
  }

  return NextResponse.json({ stems: signed });
}
