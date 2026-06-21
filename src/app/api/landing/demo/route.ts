import { NextResponse } from 'next/server';
import { DEFAULT_FEATURED, INST_ORDER, type InstrumentKey } from '@/lib/data';
import { normalizeInstrumentKeys } from '@/lib/parse-instruments';
import { createAdminClient } from '@/lib/supabase/admin';
import { PUBLISHED_CATALOG_SELECT } from '@/lib/supabase/catalog-songs';
import type { CatalogSongRow } from '@/types/catalog';
import type { LandingDemoResponse, LandingDemoStem } from '@/types/landing-demo';

const SIGNED_URL_TTL_SEC = 3600;
const VALID_INSTRUMENTS: InstrumentKey[] = [...INST_ORDER];

function staticDemoResponse(): LandingDemoResponse {
  const fallback = DEFAULT_FEATURED[0];
  const instruments = fallback.instruments.length ? fallback.instruments : VALID_INSTRUMENTS;

  return {
    song: {
      id: fallback.id,
      title: fallback.title,
      artist: fallback.artist,
      bpm: fallback.bpm,
      durationSeconds: fallback.duration,
      instruments,
      isAiGenerated: true,
    },
    stems: instruments.map((instrument) => ({
      instrument,
      url: `/demo/stems/${instrument}.wav`,
    })),
    source: 'static',
  };
}

export async function GET() {
  const envSongId = process.env.LANDING_DEMO_SONG_ID?.trim();
  let admin: ReturnType<typeof createAdminClient> | null = null;

  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(staticDemoResponse());
  }

  let query = admin
    .from('songs')
    .select(PUBLISHED_CATALOG_SELECT)
    .eq('is_featured', true)
    .eq('is_public', true)
    .eq('status', 'ready');

  if (envSongId) {
    query = query.eq('id', envSongId);
  } else {
    query = query.order('created_at', { ascending: false }).limit(1);
  }

  const { data: rows, error } = await query;

  if (error || !rows?.length) {
    return NextResponse.json(staticDemoResponse());
  }

  const row = rows[0] as CatalogSongRow;
  const instruments = normalizeInstrumentKeys(row.instruments);
  const resolvedInstruments = instruments.length ? instruments : VALID_INSTRUMENTS;

  const { data: stemRows, error: stemsErr } = await admin
    .from('stems')
    .select('instrument_type, storage_path')
    .eq('song_id', row.id);

  if (stemsErr || !stemRows?.length) {
    return NextResponse.json(staticDemoResponse());
  }

  const signed: LandingDemoStem[] = [];

  for (const stem of stemRows) {
    const instrument = stem.instrument_type as InstrumentKey;
    if (!VALID_INSTRUMENTS.includes(instrument) || !stem.storage_path) continue;

    const { data, error: signErr } = await admin.storage
      .from('stems')
      .createSignedUrl(stem.storage_path, SIGNED_URL_TTL_SEC);

    if (signErr || !data?.signedUrl) continue;

    signed.push({ instrument, url: data.signedUrl });
  }

  if (!signed.length) {
    return NextResponse.json(staticDemoResponse());
  }

  const response: LandingDemoResponse = {
    song: {
      id: row.id,
      title: row.title,
      artist: row.artist,
      bpm: row.bpm ?? 100,
      durationSeconds: row.duration_seconds ?? 180,
      instruments: resolvedInstruments,
      isAiGenerated: row.is_ai_generated ?? true,
    },
    stems: signed,
    source: 'catalog',
  };

  return NextResponse.json(response);
}
