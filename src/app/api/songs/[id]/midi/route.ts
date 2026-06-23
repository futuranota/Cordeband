import { NextResponse } from 'next/server';
import { uploadUserMidiScore } from '@/lib/songs/user-midi-upload';
import type { InstrumentKey } from '@/lib/data';
import { CATALOG_INSTRUMENTS } from '@/types/catalog';

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set<string>(CATALOG_INSTRUMENTS);

export async function POST(request: Request, { params }: Params) {
  const { id: songId } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  const instrumentRaw = form.get('instrument');
  const channelRaw = form.get('channel');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'MIDI file is required' }, { status: 400 });
  }

  const instrument = typeof instrumentRaw === 'string' ? instrumentRaw.trim() : '';
  if (!ALLOWED.has(instrument)) {
    return NextResponse.json({ error: 'Invalid instrument' }, { status: 400 });
  }

  const channel = typeof channelRaw === 'string' ? parseInt(channelRaw, 10) : undefined;

  const buffer = await file.arrayBuffer();
  const result = await uploadUserMidiScore({
    songId,
    instrument: instrument as InstrumentKey,
    fileName: file.name,
    fileSize: file.size,
    buffer,
    channel,
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if ('pending' in result) {
    return NextResponse.json({ ok: true, pending: true });
  }

  return NextResponse.json({
    ok: true,
    noteCount: result.noteCount,
    score: result.score,
  });
}
